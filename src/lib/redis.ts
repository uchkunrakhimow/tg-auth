import type { RedisConfig, OTPData, RateLimitData } from '../types';

export class RedisClient {
  private socket: any = null;
  private connected = false;
  private config: RedisConfig;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.socket = await Bun.connect({
        hostname: this.config.host,
        port: this.config.port,
        socket: {
          data: () => {}, // We'll handle responses in individual methods
        },
      });
      this.connected = true;
      console.log(`✅ Connected to Redis at ${this.config.host}:${this.config.port}`);
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.end();
      this.connected = false;
      console.log('🔌 Disconnected from Redis');
    }
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.connected) {
      throw new Error('Redis client not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Redis command timeout'));
      }, 5000);

      this.socket.write(command);
      
      // For simplicity, we'll use a basic response handler
      // In production, you'd want a proper Redis protocol parser
      this.socket.data = (socket: any, data: Buffer) => {
        clearTimeout(timeout);
        const response = data.toString();
        resolve(response);
      };
    });
  }

  async setWithTTL(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    try {
      const command = `SETEX ${key} ${ttlSeconds} ${JSON.stringify(value)}\r\n`;
      const response = await this.sendCommand(command);
      return response.includes('OK');
    } catch (error) {
      console.error('Redis SETEX error:', error);
      return false;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const command = `GET ${key}\r\n`;
      const response = await this.sendCommand(command);
      
      // Parse Redis response
      if (response.startsWith('$-1')) {
        return null; // Key not found
      }
      
      if (response.startsWith('$')) {
        const lines = response.split('\r\n');
        return lines[1] || null;
      }
      
      return null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const command = `DEL ${key}\r\n`;
      const response = await this.sendCommand(command);
      return response.includes(':1'); // DEL returns :1 for successful deletion
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = `EXISTS ${key}\r\n`;
      const response = await this.sendCommand(command);
      return response.includes(':1'); // EXISTS returns :1 if key exists
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // OTP-specific methods
  async storeOTP(code: string, user: any, ttlSeconds: number = 300): Promise<boolean> {
    const otpData: OTPData = {
      code,
      user,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttlSeconds * 1000),
    };

    const key = `otp:${code}`;
    return await this.setWithTTL(key, JSON.stringify(otpData), ttlSeconds);
  }

  async getOTP(code: string): Promise<OTPData | null> {
    const key = `otp:${code}`;
    const data = await this.get(key);
    
    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as OTPData;
    } catch (error) {
      console.error('Failed to parse OTP data:', error);
      return null;
    }
  }

  async deleteOTP(code: string): Promise<boolean> {
    const key = `otp:${code}`;
    return await this.del(key);
  }

  // Rate limiting methods
  async checkRateLimit(userId: number, windowMs: number): Promise<boolean> {
    const key = `rate_limit:${userId}`;
    const data = await this.get(key);
    
    if (!data) {
      // No previous requests, allow this one
      const rateLimitData: RateLimitData = {
        count: 1,
        resetTime: Date.now() + windowMs,
      };
      await this.setWithTTL(key, JSON.stringify(rateLimitData), Math.ceil(windowMs / 1000));
      return true;
    }

    try {
      const rateLimitData = JSON.parse(data) as RateLimitData;
      
      if (Date.now() > rateLimitData.resetTime) {
        // Window expired, reset
        const newData: RateLimitData = {
          count: 1,
          resetTime: Date.now() + windowMs,
        };
        await this.setWithTTL(key, JSON.stringify(newData), Math.ceil(windowMs / 1000));
        return true;
      }

      // Check if under limit (1 request per window)
      if (rateLimitData.count >= 1) {
        return false;
      }

      // Increment count
      rateLimitData.count++;
      await this.setWithTTL(key, JSON.stringify(rateLimitData), Math.ceil((rateLimitData.resetTime - Date.now()) / 1000));
      return true;
    } catch (error) {
      console.error('Failed to parse rate limit data:', error);
      return true; // Allow on error
    }
  }
}