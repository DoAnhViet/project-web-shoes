/**
 * COMMAND PATTERN - Order Service
 * 
 * Encapsulates order operations as command objects.
 * Mirrors backend OrderCommand pattern.
 */

import { ordersApi } from '../api/api';
import logger from './LoggerService';

// Command Interface
class Command {
  async execute() {
    throw new Error('execute() must be implemented');
  }

  async undo() {
    throw new Error('undo() must be implemented');
  }
}

// Concrete Commands
class CreateOrderCommand extends Command {
  constructor(apiOrderData, localOrderData = null) {
    super();
    this.apiOrderData = apiOrderData;
    this.localOrderData = localOrderData || apiOrderData;
    this.createdOrder = null;
  }

  async execute() {
    logger.info('📦 Executing CreateOrderCommand', { 
      items: this.apiOrderData.items?.length 
    });

    try {
      // Debug: Log what we're sending to API
      console.log('🔍 Sending to API:', this.apiOrderData);
      
      // Save to backend API
      const response = await ordersApi.create(this.apiOrderData);
      console.log('🔍 API Response:', response);
      this.createdOrder = response.data;
      
      // Also save to localStorage for offline access
      const localData = {
        ...this.localOrderData,
        orderId: this.createdOrder.orderCode,
        id: this.createdOrder.id,
        orderDate: this.createdOrder.createdAt
      };
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.unshift(localData);
      localStorage.setItem('orders', JSON.stringify(orders));

      logger.info('✅ Order created successfully', { orderId: this.createdOrder.orderCode });
      return this.createdOrder;
    } catch (error) {
      console.error('🔍 API Error Details:', error);
      console.error('🔍 Error Response:', error.response?.data);
      console.error('🔍 Error Status:', error.response?.status);
      logger.error('Failed to create order via API, saving locally', error);
      
      // Fallback: Save to localStorage only
      const localOrder = {
        ...this.localOrderData,
        orderId: this.localOrderData.orderId || 'ORD-' + Date.now(),
        orderDate: new Date().toISOString(),
        status: 'pending'
      };
      
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      orders.unshift(localOrder);
      localStorage.setItem('orders', JSON.stringify(orders));
      
      this.createdOrder = localOrder;
      return localOrder;
    }
  }

  async undo() {
    if (this.createdOrder) {
      logger.info('↩️ Undoing CreateOrderCommand', { orderId: this.createdOrder.id });
      try {
        await ordersApi.cancel(this.createdOrder.id);
      } catch (error) {
        logger.error('Failed to undo order creation', error);
      }
    }
  }
}

class CancelOrderCommand extends Command {
  constructor(orderId) {
    super();
    this.orderId = orderId;
    this.previousStatus = null;
  }

  async execute() {
    logger.info('🚫 Executing CancelOrderCommand', { orderId: this.orderId });

    try {
      // Get current status before cancelling
      const orderRes = await ordersApi.getById(this.orderId);
      this.previousStatus = orderRes.data.status;

      // Cancel via API
      await ordersApi.cancel(this.orderId);

      // Update localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.id === this.orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = 'cancelled';
        localStorage.setItem('orders', JSON.stringify(orders));
      }

      logger.info('✅ Order cancelled successfully', { orderId: this.orderId });
      return { success: true, orderId: this.orderId };
    } catch (error) {
      logger.error('Failed to cancel order via API', error);
      
      // Fallback: Update localStorage only
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.id === this.orderId);
      if (orderIndex !== -1) {
        this.previousStatus = orders[orderIndex].status;
        orders[orderIndex].status = 'cancelled';
        localStorage.setItem('orders', JSON.stringify(orders));
      }
      
      return { success: true, orderId: this.orderId, local: true };
    }
  }

  async undo() {
    if (this.previousStatus) {
      logger.info('↩️ Undoing CancelOrderCommand', { orderId: this.orderId });
      try {
        await ordersApi.updateStatus(this.orderId, this.previousStatus);
      } catch (error) {
        logger.error('Failed to undo order cancellation', error);
      }
    }
  }
}

class UpdateOrderStatusCommand extends Command {
  constructor(orderId, newStatus) {
    super();
    this.orderId = orderId;
    this.newStatus = newStatus;
    this.previousStatus = null;
  }

  async execute() {
    logger.info('🔄 Executing UpdateOrderStatusCommand', { 
      orderId: this.orderId, 
      newStatus: this.newStatus 
    });

    try {
      const orderRes = await ordersApi.getById(this.orderId);
      this.previousStatus = orderRes.data.status;

      await ordersApi.updateStatus(this.orderId, this.newStatus);

      // Update localStorage
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      const orderIndex = orders.findIndex(o => o.id === this.orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = this.newStatus;
        localStorage.setItem('orders', JSON.stringify(orders));
      }

      logger.info('✅ Order status updated', { orderId: this.orderId, status: this.newStatus });
      return { success: true, orderId: this.orderId, status: this.newStatus };
    } catch (error) {
      logger.error('Failed to update order status', error);
      throw error;
    }
  }

  async undo() {
    if (this.previousStatus) {
      await ordersApi.updateStatus(this.orderId, this.previousStatus);
    }
  }
}

/**
 * Command Invoker - Executes and manages commands
 */
class OrderCommandInvoker {
  constructor() {
    this.history = [];
    this.maxHistory = 50;
  }

  async execute(command) {
    const result = await command.execute();
    this.history.push(command);
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    return result;
  }

  async undoLast() {
    const command = this.history.pop();
    if (command) {
      await command.undo();
      logger.info('Last command undone');
    }
  }

  getHistory() {
    return this.history;
  }
}

// Singleton invoker
const orderInvoker = new OrderCommandInvoker();

// Order Service - High-level API
const OrderService = {
  createOrder: async (apiOrderData, localOrderData = null) => {
    const command = new CreateOrderCommand(apiOrderData, localOrderData);
    return await orderInvoker.execute(command);
  },

  cancelOrder: async (orderId) => {
    const command = new CancelOrderCommand(orderId);
    return await orderInvoker.execute(command);
  },

  updateStatus: async (orderId, status) => {
    const command = new UpdateOrderStatusCommand(orderId, status);
    return await orderInvoker.execute(command);
  },

  undoLastAction: async () => {
    await orderInvoker.undoLast();
  },

  getOrderHistory: () => {
    return orderInvoker.getHistory();
  },

  // Get orders from localStorage (offline support)
  getLocalOrders: () => {
    return JSON.parse(localStorage.getItem('orders') || '[]');
  }
};

export default OrderService;
export { CreateOrderCommand, CancelOrderCommand, UpdateOrderStatusCommand, OrderCommandInvoker };
