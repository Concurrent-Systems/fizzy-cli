package commands

import (
	"fmt"
	"os"
	"regexp"
	"strings"
	"sync"
	"unicode"

	"github.com/basecamp/fizzy-cli/internal/client"
)

// mentionUser represents a mentionable user parsed from the /prompts/users endpoint.
type mentionUser struct {
	FirstName string // e.g. "Wayne"
	FullName  string // e.g. "Wayne Smith"
	SGID      string // signed global ID for ActionText
	AvatarSrc string // e.g. "/6103476/users/03f5awg7.../avatar"
}

// Package-level cache: populated once per CLI invocation.
var (
	mentionUsers []mentionUser
	mentionOnce  sync.Once
	mentionErr   error
)

// resetMentionCache resets the cache for testing.
func resetMentionCache() {
	mentionOnce = sync.Once{}
	mentionUsers = nil
	mentionErr = nil
}

// mentionRegex matches @Name patterns not preceded by word characters or dots
// (to avoid matching emails like user@example.com).
var mentionRegex = regexp.MustCompile(`(?:^|[^a-zA-Z0-9_.])@([a-zA-Z][a-zA-Z0-9_]*)`)

// promptItemRegex parses <lexxy-prompt-item> tags from the /prompts/users HTML.
var promptItemRegex = regexp.MustCompile(`<lexxy-prompt-item\s+search="([^"]+)"\s+sgid="([^"]+)"[^>]*>`)

// avatarRegex extracts the src attribute from the first <img> in editor template.
var avatarRegex = regexp.MustCompile(`<img[^>]+src="([^"]+)"`)

// resolveMentions scans text for @FirstName patterns and replaces them with
// ActionText mention HTML. If the text contains no @ characters, it is returned
// unchanged. On any error fetching users, the original text is returned with a
// warning printed to stderr.
func resolveMentions(text string, c client.API) string {
	if !strings.Contains(text, "@") {
		return text
	}

	mentionOnce.Do(func() {
		mentionUsers, mentionErr = fetchMentionUsers(c)
	})

	if mentionErr != nil {
		fmt.Fprintf(os.Stderr, "Warning: could not fetch mentionable users: %v\n", mentionErr)
		return text
	}

	if len(mentionUsers) == 0 {
		return text
	}

	// Find all @Name matches with positions
	type mentionMatch struct {
		start int // start of @Name (the @ character)
		end   int // end of @Name
		name  string
	}

	allMatches := mentionRegex.FindAllStringSubmatchIndex(text, -1)
	var matches []mentionMatch
	for _, loc := range allMatches {
		// loc[2]:loc[3] is the capture group (the name without @)
		nameStart := loc[2]
		nameEnd := loc[3]
		// The @ is one character before the name
		atStart := nameStart - 1
		name := text[nameStart:nameEnd]
		matches = append(matches, mentionMatch{start: atStart, end: nameEnd, name: name})
	}

	// Process from end to start so replacements don't shift indices
	for i := len(matches) - 1; i >= 0; i-- {
		m := matches[i]

		// Find matching user by first name (case-insensitive)
		var found []mentionUser
		for _, u := range mentionUsers {
			if strings.EqualFold(u.FirstName, m.name) {
				found = append(found, u)
			}
		}

		switch len(found) {
		case 1:
			html := buildMentionHTML(found[0])
			text = text[:m.start] + html + text[m.end:]
		case 0:
			fmt.Fprintf(os.Stderr, "Warning: could not resolve mention @%s\n", m.name)
		default:
			names := make([]string, len(found))
			for j, u := range found {
				names[j] = u.FullName
			}
			fmt.Fprintf(os.Stderr, "Warning: ambiguous mention @%s — matches: %s\n", m.name, strings.Join(names, ", "))
		}
	}

	return text
}

// fetchMentionUsers fetches the list of mentionable users from the API.
func fetchMentionUsers(c client.API) ([]mentionUser, error) {
	resp, err := c.GetHTML("/prompts/users")
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("unexpected status %d from /prompts/users", resp.StatusCode)
	}
	return parseMentionUsers(resp.Body), nil
}

// parseMentionUsers extracts mentionable users from the /prompts/users HTML.
// Each user is represented as a <lexxy-prompt-item> element with search and sgid
// attributes, containing <img> tags with avatar URLs.
func parseMentionUsers(html []byte) []mentionUser {
	htmlStr := string(html)
	items := promptItemRegex.FindAllStringSubmatch(htmlStr, -1)
	if len(items) == 0 {
		return nil
	}

	var users []mentionUser
	for _, item := range items {
		search := strings.TrimSpace(item[1])
		sgid := item[2]

		if search == "" || sgid == "" {
			continue
		}

		// Parse name from search attribute.
		// Format: "Full Name INITIALS [me]"
		// Strip trailing "me" and all-uppercase words (initials like "WS", "FMA").
		words := strings.Fields(search)
		for len(words) > 1 {
			last := words[len(words)-1]
			if last == "me" || isAllUpper(last) {
				words = words[:len(words)-1]
			} else {
				break
			}
		}

		fullName := strings.Join(words, " ")
		firstName := words[0]

		// Extract avatar URL: find the <img> after this sgid in the HTML.
		avatarSrc := ""
		sgidIdx := strings.Index(htmlStr, `sgid="`+sgid+`"`)
		if sgidIdx >= 0 {
			// Search for the first <img> after the sgid
			remainder := htmlStr[sgidIdx:]
			if m := avatarRegex.FindStringSubmatch(remainder); len(m) > 1 {
				avatarSrc = m[1]
			}
		}

		users = append(users, mentionUser{
			FirstName: firstName,
			FullName:  fullName,
			SGID:      sgid,
			AvatarSrc: avatarSrc,
		})
	}

	return users
}

// buildMentionHTML creates the ActionText attachment HTML for a mention.
func buildMentionHTML(u mentionUser) string {
	return fmt.Sprintf(
		`<action-text-attachment sgid="%s" content-type="application/vnd.actiontext.mention">`+
			`<img title="%s" src="%s" width="48" height="48">%s`+
			`</action-text-attachment>`,
		u.SGID, u.FullName, u.AvatarSrc, u.FirstName,
	)
}

// isAllUpper returns true if s is non-empty and all uppercase letters.
func isAllUpper(s string) bool {
	if s == "" {
		return false
	}
	for _, r := range s {
		if !unicode.IsUpper(r) {
			return false
		}
	}
	return true
}
