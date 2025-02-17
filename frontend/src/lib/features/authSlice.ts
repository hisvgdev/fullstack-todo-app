import instance from "@/config/axios.config";
import { createAsyncThunk, createSlice, SerializedError } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from 'js-cookie';

interface User {
  _id: string;
  username: string;
  token: {
    access_token: string;
  };
}

interface AuthState {
  user: User | null;
  token: {
    access_token: string | null;
  };
  loading: boolean;
  error: SerializedError;
}

const initialState: AuthState = {
  user: null,
  token: { access_token: '' },
  loading: false,
  error: {
    name: "",
    message: "",
    stack: "",
    code: "",
  }
};

export const registerUser = createAsyncThunk<User, { username: string; password: string; }, { rejectValue: string; }>(
  'auth/registerUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await instance.post('/auth/register', { username, password });
      return response.data; // Возвращаем данные пользователя
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Registration failed');
      }
      return rejectWithValue('Registration failed');
    }
  }
);


export const loginUser = createAsyncThunk<User & { token: { access_token: string; }; }, { username: string; password: string; }, { rejectValue: string; }>(
  'auth/loginUser',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await instance.post('/auth/login', { username, password });
      const { user, token } = response.data;

      return { _id: user._id, username: user.username, token: { access_token: token.access_token } };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(error.response.data.message || 'Login failed');
      }
      return rejectWithValue('Login failed');
    }
  }
);

const authSlice = createSlice({
  name: 'authSlice',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = { access_token: '' };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error;
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
        Cookies.set('jwt', action.payload.token.access_token, { expires: 7 });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error;
      });
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;