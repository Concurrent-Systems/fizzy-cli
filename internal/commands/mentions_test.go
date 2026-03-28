package commands

import (
	"fmt"
	"strings"
	"testing"

	"github.com/basecamp/fizzy-cli/internal/client"
)

const samplePromptUsersHTML = `
<lexxy-prompt-item search="Wayne Smith WS me" sgid="wayne-sgid-123">
  <template type="menu">
    <img aria-hidden="true" title="Wayne Smith" src="/123/users/u1/avatar" width="48" height="48" />
    Wayne Smith
  </template>
  <template type="editor">
    <img aria-hidden="true" title="Wayne Smith" src="/123/users/u1/avatar" width="48" height="48" />
    Wayne
  </template>
</lexxy-prompt-item>
<lexxy-prompt-item search="Bushra Gul BG" sgid="bushra-sgid-456">
  <template type="menu">
    <img aria-hidden="true" title="Bushra Gul" src="/123/users/u2/avatar" width="48" height="48" />
    Bushra Gul
  </template>
  <template type="editor">
    <img aria-hidden="true" title="Bushra Gul" src="/123/users/u2/avatar" width="48" height="48" />
    Bushra
  </template>
</lexxy-prompt-item>
<lexxy-prompt-item search="Kennedy K" sgid="kennedy-sgid-789">
  <template type="menu">
    <img aria-hidden="true" title="Kennedy" src="/123/users/u3/avatar" width="48" height="48" />
    Kennedy
  </template>
  <template type="editor">
    <img aria-hidden="true" title="Kennedy" src="/123/users/u3/avatar" width="48" height="48" />
    Kennedy
  </template>
</lexxy-prompt-item>
`

func newMentionMockClient() *MockClient {
	m := NewMockClient()
	m.GetHTMLResponse = &client.APIResponse{
		StatusCode: 200,
		Body:       []byte(samplePromptUsersHTML),
	}
	return m
}

func TestParseMentionUsers(t *testing.T) {
	users := parseMentionUsers([]byte(samplePromptUsersHTML))

	if len(users) != 3 {
		t.Fatalf("expected 3 users, got %d", len(users))
	}

	tests := []struct {
		idx       int
		firstName string
		fullName  string
		sgid      string
	}{
		{0, "Wayne", "Wayne Smith", "wayne-sgid-123"},
		{1, "Bushra", "Bushra Gul", "bushra-sgid-456"},
		{2, "Kennedy", "Kennedy", "kennedy-sgid-789"},
	}

	for _, tt := range tests {
		u := users[tt.idx]
		if u.FirstName != tt.firstName {
			t.Errorf("user[%d] FirstName = %q, want %q", tt.idx, u.FirstName, tt.firstName)
		}
		if u.FullName != tt.fullName {
			t.Errorf("user[%d] FullName = %q, want %q", tt.idx, u.FullName, tt.fullName)
		}
		if u.SGID != tt.sgid {
			t.Errorf("user[%d] SGID = %q, want %q", tt.idx, u.SGID, tt.sgid)
		}
		if u.AvatarSrc == "" {
			t.Errorf("user[%d] AvatarSrc is empty", tt.idx)
		}
	}
}

func TestParseMentionUsersEmpty(t *testing.T) {
	users := parseMentionUsers([]byte(""))
	if len(users) != 0 {
		t.Errorf("expected 0 users from empty HTML, got %d", len(users))
	}
}

func TestResolveMentions(t *testing.T) {
	tests := []struct {
		name           string
		input          string
		shouldContain  []string
		shouldNotMatch []string // substrings that should NOT appear
	}{
		{
			name:           "no @ passthrough",
			input:          "Hello world",
			shouldContain:  []string{"Hello world"},
			shouldNotMatch: []string{"action-text-attachment"},
		},
		{
			name:          "single mention",
			input:         "Hey @Wayne check this",
			shouldContain: []string{`sgid="wayne-sgid-123"`, `content-type="application/vnd.actiontext.mention"`, `title="Wayne Smith"`, ">Wayne<"},
		},
		{
			name:          "case insensitive",
			input:         "Hey @wayne check this",
			shouldContain: []string{`sgid="wayne-sgid-123"`},
		},
		{
			name:          "multiple mentions",
			input:         "@Wayne and @Bushra please review",
			shouldContain: []string{`sgid="wayne-sgid-123"`, `sgid="bushra-sgid-456"`},
		},
		{
			name:           "email not treated as mention",
			input:          "Contact user@example.com",
			shouldContain:  []string{"user@example.com"},
			shouldNotMatch: []string{"action-text-attachment"},
		},
		{
			name:           "unresolved mention stays as text",
			input:          "Hey @Unknown person",
			shouldContain:  []string{"@Unknown"},
			shouldNotMatch: []string{"action-text-attachment"},
		},
		{
			name:          "mention at start of text",
			input:         "@Kennedy can you look?",
			shouldContain: []string{`sgid="kennedy-sgid-789"`},
		},
		{
			name:          "mention after newline",
			input:         "First line\n@Wayne second line",
			shouldContain: []string{`sgid="wayne-sgid-123"`},
		},
		{
			name:          "single name user",
			input:         "Hey @Kennedy",
			shouldContain: []string{`sgid="kennedy-sgid-789"`, `title="Kennedy"`},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			resetMentionCache()
			mock := newMentionMockClient()
			result := resolveMentions(tt.input, mock)

			for _, s := range tt.shouldContain {
				if !strings.Contains(result, s) {
					t.Errorf("result should contain %q\ngot: %s", s, result)
				}
			}
			for _, s := range tt.shouldNotMatch {
				if strings.Contains(result, s) {
					t.Errorf("result should NOT contain %q\ngot: %s", s, result)
				}
			}
		})
	}
}

func TestResolveMentionsAPIError(t *testing.T) {
	resetMentionCache()
	mock := NewMockClient()
	mock.GetHTMLError = fmt.Errorf("server error")

	// Should return text unchanged on error
	input := "Hey @Wayne"
	result := resolveMentions(input, mock)
	if result != input {
		t.Errorf("expected unchanged text on error, got: %s", result)
	}
}

func TestResolveMentionsCaching(t *testing.T) {
	resetMentionCache()
	mock := newMentionMockClient()

	// First call fetches
	resolveMentions("@Wayne", mock)
	if len(mock.GetHTMLCalls) != 1 {
		t.Errorf("expected 1 GetHTML call, got %d", len(mock.GetHTMLCalls))
	}

	// Second call uses cache
	resolveMentions("@Bushra", mock)
	if len(mock.GetHTMLCalls) != 1 {
		t.Errorf("expected still 1 GetHTML call (cached), got %d", len(mock.GetHTMLCalls))
	}
}
