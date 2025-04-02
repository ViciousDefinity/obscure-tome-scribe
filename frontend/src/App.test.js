import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App, { apiCall } from './App';

// Mock apiCall
jest.mock('./App', () => {
  const originalModule = jest.requireActual('./App');
  return {
    __esModule: true,
    ...originalModule,
    apiCall: jest.fn(),
  };
});

// Mock window.alert and window.confirm
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => (store[key] = value.toString()),
    removeItem: (key) => delete store[key],
    clear: () => (store = {}),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.useFakeTimers();

    // Mock apiCall responses
    apiCall.mockImplementation((method, url, data, isMultipart, token) => {
      console.log('apiCall mocked:', { method, url, token });
      if (method === 'get' && url === '/api/campaigns/') {
        return Promise.resolve({
          data: [{ id: 1, name: 'Campaign 1', description: 'Test campaign', is_active: true }],
        });
      }
      if (method === 'post' && url === 'http://localhost:8000/api/login/') {
        return Promise.resolve({
          data: { access: 'fake-token', refresh: 'fake-refresh' },
        });
      }
      if (method === 'post' && url === 'http://localhost:8000/api/campaigns/') {
        return Promise.resolve({
          data: { id: 2, name: 'Campaign 2', description: 'New campaign', is_active: true },
        });
      }
      if (method === 'post' && url === 'http://localhost:8000/api/token/refresh/') {
        return Promise.resolve({ data: { access: 'new-fake-token' } });
      }
      if (method === 'put' && url === 'http://localhost:8000/api/campaigns/1/') {
        return Promise.resolve({
          data: { id: 1, name: 'Campaign 1', description: 'Test campaign', is_active: false },
        });
      }
      if (method === 'delete' && url === 'http://localhost:8000/api/campaigns/1/') {
        return Promise.resolve({});
      }
      return Promise.reject(new Error('Not mocked'));
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders login form initially', () => {
    render(<App />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  test('logs in successfully and shows campaigns', async () => {
    render(<App />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('fake-token');
      expect(screen.getByText('Campaigns')).toBeInTheDocument();
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('handles login failure', async () => {
    apiCall.mockImplementationOnce(() => Promise.reject({ response: { status: 400, data: { detail: 'Bad Request' } } }));
    render(<App />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'wrongpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Login failed: Bad Request');
    }, { timeout: 10000 });
  });

  test('logs out and returns to login screen', async () => {
    render(<App />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
  });

  test('adds a new campaign', async () => {
    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.click(screen.getByText('Add Campaign'));
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Campaign Name')).toBeInTheDocument();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Campaign Name'), { target: { value: 'Campaign 2' } });
      fireEvent.change(screen.getByPlaceholderText('Description'), { target: { value: 'New campaign' } });
      fireEvent.click(screen.getByTestId('add-campaign-submit'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 2')).toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('toggles campaign status', async () => {
    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.click(screen.getByTestId('toggle-campaign-status'));
    });

    expect(apiCall).toHaveBeenCalledWith(
      'put',
      'http://localhost:8000/api/campaigns/1/',
      expect.objectContaining({ is_active: false }),
      false,
      'fake-token'
    );
  });

  test('deletes a campaign', async () => {
    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.click(screen.getByTestId('delete-campaign'));
    });

    await waitFor(() => {
      expect(screen.queryByText('Campaign 1')).not.toBeInTheDocument();
    }, { timeout: 10000 });
  });

  test('handles API errors', async () => {
    apiCall.mockRejectedValueOnce({ response: { data: { detail: 'Server Error' } } });

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(alert).toHaveBeenCalledWith('Failed to fetch campaigns: Server Error');
    }, { timeout: 10000 });
  });

  test('remembers login credentials when "Remember Me" is checked', async () => {
    render(<App />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByLabelText('Remember Me'));
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(localStorage.getItem('username')).toBe('testuser');
      expect(localStorage.getItem('password')).toBe('testpass');
    }, { timeout: 10000 });
  });

  test('clears credentials on logout when "Remember Me" is not checked', async () => {
    render(<App />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    }, { timeout: 10000 });

    await act(async () => {
      fireEvent.click(screen.getByText('Logout'));
    });

    expect(localStorage.getItem('username')).toBeNull();
    expect(localStorage.getItem('password')).toBeNull();
  });

  test('refreshes token on 401 error', async () => {
    apiCall.mockRejectedValueOnce({ response: { status: 401 } });

    render(<App />);
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
      expect(localStorage.getItem('token')).toBe('new-fake-token');
    }, { timeout: 10000 });
  });

  test('renders campaign list', async () => {
    render(<App />);

    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText('Username'), { target: { value: 'testuser' } });
      fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'testpass' } });
      fireEvent.click(screen.getByText('Login'));
    });

    await waitFor(() => {
      expect(screen.getByText('Campaign 1')).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});