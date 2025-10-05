import { isOTPExpired, isValidOTPFormat } from "../lib/otp";
import { RedisClient } from "../lib/redis";
import type { TelegramUser, VerifyOTPResponse } from "../types";

export class APIServer {
  private redis: RedisClient;
  private port: number;

  constructor(redis: RedisClient, port: number) {
    this.redis = redis;
    this.port = port;
  }

  async start(): Promise<void> {
    Bun.serve({
      port: this.port,
      fetch: async (req) => {
        const url = new URL(req.url);

        // CORS headers
        const corsHeaders = {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        };

        // Handle preflight requests
        if (req.method === "OPTIONS") {
          return new Response(null, { status: 200, headers: corsHeaders });
        }

        // Route handling
        if (url.pathname === "/api/verify-otp" && req.method === "POST") {
          return await this.handleVerifyOTP(req, corsHeaders);
        }

        if (url.pathname === "/health" && req.method === "GET") {
          return new Response(
            JSON.stringify({
              status: "ok",
              timestamp: new Date().toISOString(),
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json", ...corsHeaders },
            }
          );
        }

        return new Response(JSON.stringify({ error: "Not Found" }), {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    });

    console.log(`🚀 API server running on http://localhost:${this.port}`);
    console.log(`📊 Health check: http://localhost:${this.port}/health`);
    console.log(
      `🔐 OTP verification: http://localhost:${this.port}/api/verify-otp`
    );
  }

  private async handleVerifyOTP(
    req: Request,
    corsHeaders: Record<string, string>
  ): Promise<Response> {
    try {
      // Parse request body
      let body: { code?: unknown };
      try {
        body = (await req.json()) as unknown as { code?: unknown };
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid JSON in request body",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Validate request
      if (!body.code || typeof body.code !== "string") {
        return new Response(
          JSON.stringify({ success: false, message: "OTP code is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const code = body.code as string;

      // Validate OTP format
      if (!isValidOTPFormat(code)) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid OTP format. Must be 6 digits.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Get OTP data from Redis
      const otpData = await this.redis.getOTP(code);

      if (!otpData) {
        console.log(`❌ OTP verification failed: Code ${code} not found`);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid or expired code",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // Check if OTP is expired
      if (isOTPExpired(otpData.createdAt, 300000)) {
        // 5 minutes = 300000ms
        // Clean up expired OTP
        await this.redis.deleteOTP(code);
        console.log(`⏰ OTP verification failed: Code ${code} expired`);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid or expired code",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // OTP is valid - delete it to prevent reuse
      await this.redis.deleteOTP(code);

      // Prepare user data for response
      const user: TelegramUser = {
        id: otpData.user.id,
        username: otpData.user.username,
        first_name: otpData.user.first_name,
        last_name: otpData.user.last_name,
        full_name: otpData.user.full_name,
      };

      console.log(
        `✅ OTP verification successful for user ${user.id} (${user.full_name})`
      );

      const response: VerifyOTPResponse = {
        success: true,
        user,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (error) {
      console.error("❌ Error in OTP verification:", error);
      return new Response(
        JSON.stringify({ success: false, message: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  }
}
