import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supportService } from '../../services/api';

// Типы данных
interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
}

interface Ticket {
  id: number;
  userId: number;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  closedAt: string | null;
  messages?: TicketMessage[];
}

interface SupportState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  messages: TicketMessage[];
  loading: boolean;
  error: string | null;
}

// Начальное состояние
const initialState: SupportState = {
  tickets: [],
  currentTicket: null,
  messages: [],
  loading: false,
  error: null
};

// Асинхронные action creators
export const fetchUserTickets = createAsyncThunk<
  Ticket[],
  void
>(
  'support/fetchUserTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await supportService.getUserTickets();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить тикеты');
    }
  }
);

export const fetchTicketById = createAsyncThunk<
  Ticket,
  number
>(
  'support/fetchTicketById',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await supportService.getTicketById(ticketId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить тикет');
    }
  }
);

export const fetchTicketMessages = createAsyncThunk<
  TicketMessage[],
  number
>(
  'support/fetchTicketMessages',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await supportService.getTicketMessages(ticketId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить сообщения тикета');
    }
  }
);

export const createTicket = createAsyncThunk<
  Ticket,
  { subject: string; message: string }
>(
  'support/createTicket',
  async (ticketData, { rejectWithValue }) => {
    try {
      const response = await supportService.createTicket(ticketData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось создать тикет');
    }
  }
);

export const addTicketMessage = createAsyncThunk<
  TicketMessage,
  { ticketId: number; message: string }
>(
  'support/addTicketMessage',
  async ({ ticketId, message }, { rejectWithValue }) => {
    try {
      const response = await supportService.addTicketMessage(ticketId, message);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось отправить сообщение');
    }
  }
);

export const closeTicket = createAsyncThunk<
  Ticket,
  number
>(
  'support/closeTicket',
  async (ticketId, { rejectWithValue }) => {
    try {
      const response = await supportService.closeTicket(ticketId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось закрыть тикет');
    }
  }
);

// Создание slice
const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {
    clearTicketData: (state) => {
      state.currentTicket = null;
      state.messages = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Обработка fetchUserTickets
      .addCase(fetchUserTickets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserTickets.fulfilled, (state, action: PayloadAction<Ticket[]>) => {
        state.loading = false;
        state.tickets = action.payload;
      })
      .addCase(fetchUserTickets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка fetchTicketById
      .addCase(fetchTicketById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketById.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.loading = false;
        state.currentTicket = action.payload;
      })
      .addCase(fetchTicketById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка fetchTicketMessages
      .addCase(fetchTicketMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketMessages.fulfilled, (state, action: PayloadAction<TicketMessage[]>) => {
        state.loading = false;
        state.messages = action.payload;
      })
      .addCase(fetchTicketMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка createTicket
      .addCase(createTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTicket.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.loading = false;
        state.tickets.push(action.payload);
        state.currentTicket = action.payload;
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка addTicketMessage
      .addCase(addTicketMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTicketMessage.fulfilled, (state, action: PayloadAction<TicketMessage>) => {
        state.loading = false;
        state.messages.push(action.payload);
      })
      .addCase(addTicketMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка closeTicket
      .addCase(closeTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeTicket.fulfilled, (state, action: PayloadAction<Ticket>) => {
        state.loading = false;
        // Обновляем статус тикета в списке
        const ticket = state.tickets.find(t => t.id === action.payload.id);
        if (ticket) {
          ticket.status = 'closed';
          ticket.closedAt = action.payload.closedAt;
        }
        // Обновляем текущий тикет, если он открыт
        if (state.currentTicket && state.currentTicket.id === action.payload.id) {
          state.currentTicket.status = 'closed';
          state.currentTicket.closedAt = action.payload.closedAt;
        }
      })
      .addCase(closeTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  }
});

export const { clearTicketData } = supportSlice.actions;

// Экспортируем addTicketMessage как sendMessage для обратной совместимости
export const sendMessage = addTicketMessage;

export default supportSlice.reducer; 