import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supportService } from '../../services/api';

// Асинхронные действия
export const fetchUserTickets = createAsyncThunk(
  'support/fetchUserTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await supportService.getUserTickets();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить тикеты');
    }
  }
);

export const createTicket = createAsyncThunk(
  'support/createTicket',
  async ({ subject, message }, { rejectWithValue }) => {
    try {
      const response = await supportService.createTicket(subject, message);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось создать тикет');
    }
  }
);

export const closeTicket = createAsyncThunk(
  'support/closeTicket',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await supportService.closeTicket(ticketId);
      return { ticketId, data: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось закрыть тикет');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'support/sendMessage',
  async ({ ticketId, message }, { rejectWithValue }) => {
    try {
      const response = await supportService.sendMessage(ticketId, message);
      return { ticketId, message: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось отправить сообщение');
    }
  }
);

export const fetchTicketMessages = createAsyncThunk(
  'support/fetchTicketMessages',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await supportService.getTicketMessages(ticketId);
      return { ticketId, messages: response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить сообщения');
    }
  }
);

// Slice
const supportSlice = createSlice({
  name: 'support',
  initialState: {
    tickets: [],
    ticketMessages: {},
    loading: false,
    error: null,
    currentTicket: null
  },
  reducers: {
    setCurrentTicket(state, action) {
      state.currentTicket = action.payload;
    },
    clearSupportErrors(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработчики для fetchUserTickets
      .addCase(fetchUserTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для createTicket
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action) => {
        state.loading = false;
        state.tickets.unshift(action.payload);
        state.currentTicket = action.payload.id;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для closeTicket
      .addCase(closeTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeTicket.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tickets.findIndex(ticket => ticket.id === action.payload.ticketId);
        if (index !== -1) {
          state.tickets[index].status = 'closed';
          state.tickets[index].closedAt = new Date().toISOString();
        }
      })
      .addCase(closeTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false;
        
        if (!state.ticketMessages[action.payload.ticketId]) {
          state.ticketMessages[action.payload.ticketId] = [];
        }
        
        state.ticketMessages[action.payload.ticketId].push(action.payload.message);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Обработчики для fetchTicketMessages
      .addCase(fetchTicketMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.ticketMessages[action.payload.ticketId] = action.payload.messages;
      })
      .addCase(fetchTicketMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setCurrentTicket, clearSupportErrors } = supportSlice.actions;
export default supportSlice.reducer; 