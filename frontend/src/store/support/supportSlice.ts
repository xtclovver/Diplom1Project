import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Типы данных
interface Ticket {
  id: number;
  userId: number;
  subject: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  closedAt: string | null;
}

interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  message: string;
  createdAt: string;
  user: {
    username: string;
    role: string;
  };
}

interface SupportState {
  tickets: Ticket[];
  ticketMessages: Record<number, TicketMessage[]>;
  loading: boolean;
  error: string | null;
}

// Начальное состояние
const initialState: SupportState = {
  tickets: [],
  ticketMessages: {},
  loading: false,
  error: null
};

// API mock (в реальном приложении здесь будут реальные запросы к API)
const mockFetchTickets = (): Promise<Ticket[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          userId: 1,
          subject: 'Проблема с бронированием',
          status: 'open',
          createdAt: '2023-05-15T10:23:45',
          closedAt: null
        },
        {
          id: 2,
          userId: 1,
          subject: 'Вопрос по оплате',
          status: 'in_progress',
          createdAt: '2023-05-16T15:10:20',
          closedAt: null
        },
        {
          id: 3,
          userId: 2,
          subject: 'Возврат средств',
          status: 'closed',
          createdAt: '2023-05-10T09:05:30',
          closedAt: '2023-05-12T14:30:00'
        }
      ]);
    }, 800);
  });
};

const mockFetchTicketMessages = (ticketId: number): Promise<TicketMessage[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (ticketId === 1) {
        resolve([
          {
            id: 1,
            ticketId: 1,
            userId: 1,
            message: 'У меня не получается забронировать тур, пишет ошибку.',
            createdAt: '2023-05-15T10:23:45',
            user: {
              username: 'user1',
              role: 'user'
            }
          },
          {
            id: 2,
            ticketId: 1,
            userId: 3,
            message: 'Здравствуйте! Подскажите, пожалуйста, какую ошибку вы видите?',
            createdAt: '2023-05-15T11:15:22',
            user: {
              username: 'support1',
              role: 'support'
            }
          }
        ]);
      } else if (ticketId === 2) {
        resolve([
          {
            id: 3,
            ticketId: 2,
            userId: 1,
            message: 'Добрый день! Как я могу оплатить тур онлайн?',
            createdAt: '2023-05-16T15:10:20',
            user: {
              username: 'user1',
              role: 'user'
            }
          },
          {
            id: 4,
            ticketId: 2,
            userId: 3,
            message: 'Здравствуйте! На странице бронирования есть кнопка "Оплатить". После ее нажатия вы будете перенаправлены на страницу оплаты.',
            createdAt: '2023-05-16T15:30:45',
            user: {
              username: 'support1',
              role: 'support'
            }
          },
          {
            id: 5,
            ticketId: 2,
            userId: 1,
            message: 'Спасибо! А какие способы оплаты доступны?',
            createdAt: '2023-05-16T15:35:20',
            user: {
              username: 'user1',
              role: 'user'
            }
          }
        ]);
      } else {
        resolve([]);
      }
    }, 500);
  });
};

// Асинхронные action creators
export const fetchUserTickets = createAsyncThunk(
  'support/fetchUserTickets',
  async (_, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      const response = await mockFetchTickets();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить тикеты');
    }
  }
);

export const fetchTicketMessages = createAsyncThunk<
  { ticketId: number; messages: TicketMessage[] },
  number
>(
  'support/fetchTicketMessages',
  async (ticketId, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      const response = await mockFetchTicketMessages(ticketId);
      return { ticketId, messages: response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось загрузить сообщения');
    }
  }
);

export const createTicket = createAsyncThunk<
  Ticket,
  { subject: string; message: string }
>(
  'support/createTicket',
  async (payload, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      // Имитация ответа от сервера
      return {
        id: Date.now(),
        userId: 1, // В реальном приложении будет ID текущего пользователя
        subject: payload.subject,
        status: 'open' as const,
        createdAt: new Date().toISOString(),
        closedAt: null
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось создать тикет');
    }
  }
);

export const sendMessage = createAsyncThunk<
  TicketMessage,
  { ticketId: number; message: string }
>(
  'support/sendMessage',
  async (payload, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      // Имитация ответа от сервера
      return {
        id: Date.now(),
        ticketId: payload.ticketId,
        userId: 1, // В реальном приложении будет ID текущего пользователя
        message: payload.message,
        createdAt: new Date().toISOString(),
        user: {
          username: 'currentUser', // В реальном приложении будет имя текущего пользователя
          role: 'user'
        }
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось отправить сообщение');
    }
  }
);

export const closeTicket = createAsyncThunk<
  number,
  number
>(
  'support/closeTicket',
  async (ticketId, { rejectWithValue }) => {
    try {
      // В реальном приложении здесь будет запрос к API
      // Имитация успешного ответа
      return ticketId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Не удалось закрыть тикет');
    }
  }
);

// Создание slice
const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {},
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
      
      // Обработка fetchTicketMessages
      .addCase(fetchTicketMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTicketMessages.fulfilled, (state, action: PayloadAction<{ ticketId: number; messages: TicketMessage[] }>) => {
        state.loading = false;
        const { ticketId, messages } = action.payload;
        state.ticketMessages[ticketId] = messages;
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
      })
      .addCase(createTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка sendMessage
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<TicketMessage>) => {
        state.loading = false;
        const { ticketId } = action.payload;
        if (!state.ticketMessages[ticketId]) {
          state.ticketMessages[ticketId] = [];
        }
        state.ticketMessages[ticketId].push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Обработка closeTicket
      .addCase(closeTicket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(closeTicket.fulfilled, (state, action: PayloadAction<number>) => {
        state.loading = false;
        const ticketId = action.payload;
        const ticket = state.tickets.find(t => t.id === ticketId);
        if (ticket) {
          ticket.status = 'closed';
          ticket.closedAt = new Date().toISOString();
        }
      })
      .addCase(closeTicket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default supportSlice.reducer; 