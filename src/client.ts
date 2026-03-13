// Fizzy API Client

import type { Config } from './config';

export interface PaginatedResponse<T> {
  data: T[];
  nextUrl: string | null;
}

export class FizzyClient {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get accountId(): string {
    return this.config.accountId;
  }

  private headers(contentType = 'application/json'): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Accept': 'application/json',
      'Content-Type': contentType,
    };
  }

  /**
   * Make a GET request and return JSON response
   */
  async get<T>(path: string): Promise<T> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Make a GET request with pagination support
   */
  async getPaginated<T>(path: string): Promise<PaginatedResponse<T>> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.headers(),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as T[];

    // Parse Link header for next page
    const linkHeader = response.headers.get('Link');
    let nextUrl: string | null = null;

    if (linkHeader) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      if (match) {
        nextUrl = match[1];
      }
    }

    return { data, nextUrl };
  }

  /**
   * Fetch all pages of a paginated endpoint
   */
  async getAll<T>(path: string): Promise<T[]> {
    const results: T[] = [];
    let nextUrl: string | null = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;

    while (nextUrl) {
      const response: PaginatedResponse<T> = await this.getPaginated<T>(nextUrl);
      results.push(...response.data);
      nextUrl = response.nextUrl;
    }

    return results;
  }

  /**
   * Make a POST request
   */
  async post<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${text}`);
    }

    // 201 Created or 204 No Content
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return null;
  }

  /**
   * Make a PUT request
   */
  async put<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${text}`);
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('Content-Type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return null;
  }

  /**
   * Make a DELETE request
   */
  async delete(path: string): Promise<void> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.headers(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${text}`);
    }
  }

  /**
   * Make a GET request and return raw HTML response
   */
  async getHtml(path: string): Promise<string> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
        'Accept': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Upload a file to a URL with specific headers (for direct uploads)
   */
  async uploadFile(
    url: string,
    file: Uint8Array,
    headers: Record<string, string>
  ): Promise<void> {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: file as unknown as BodyInit,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Download a file as binary data
   * Path should be relative (e.g., /6103476/rails/active_storage/blobs/redirect/...)
   * Note: File URLs already include account ID, so we use base domain only
   */
  async downloadFile(path: string): Promise<Uint8Array> {
    // File paths from Fizzy HTML already include account ID (e.g., /6103476/rails/...)
    // Use base domain without account ID to avoid duplication
    const baseDomain = 'https://app.fizzy.do';
    const url = path.startsWith('http') ? path : `${baseDomain}${path}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiToken}`,
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
}
