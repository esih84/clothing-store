import {
  BadRequestException,
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { SendOtpDto } from "./dto/send-otp.dto";
import { UserService } from "../user/user.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Otp } from "./entities/otp.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { randomInt } from "crypto";
import { User } from "../user/entities/user.entity";
import * as bcrypt from "bcrypt";
import { Request } from "express";
import { REQUEST } from "@nestjs/core";

@Injectable({ scope: Scope.REQUEST })
export class AuthService {
  constructor(
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private jwtService: JwtService,
    private userService: UserService,
    @Inject(REQUEST) private request: Request
  ) {}
  async sendOtp(sendOtpDto: SendOtpDto) {
    const { mobile } = sendOtpDto;
    const user = await this.userService.create({ mobile });
    await this.generateOtp(user);
    return { message: "OTP sent successfully" };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { mobile, code } = verifyOtpDto;
    const user = await this.userService.customSearch({ mobile }, { otp: true });
    if (!user) {
      throw new BadRequestException("user not found");
    }
    const otp = await this.otpRepository.findOneBy({ userId: user.id });
    if (!otp || otp.code !== code || otp.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired OTP");
    }
    if (!user.isVerified) {
      await this.userService.verifyMobile(user.id);
    }
    await this.otpRepository.delete({ id: otp.id });
    const { accessToken, refreshToken } = await this.generateTokens(user);
    return {
      accessToken,
      refreshToken,
      message: "OTP verified, tokens issued",
    };
  }

  async generateOtp(user: User) {
    const otpCode = randomInt(100000, 999999).toString();
    console.log(otpCode);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 2);
    let otp = await this.otpRepository.findOneBy({ userId: user.id });
    if (otp) {
      if (otp.expiresAt > new Date()) {
        throw new BadRequestException("The otp code has not expired");
      }
      otp.code = otpCode;
      otp.expiresAt = expiresAt;
    } else {
      otp = this.otpRepository.create({
        code: otpCode,
        expiresAt,
        user,
        userId: user.id,
      });
    }
    await this.otpRepository.save(otp);
  }
  async generateTokens(user: User) {
    const payload = { id: user.id, mobile: user.mobile };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: "15m",
      secret: process.env.ACCESS_TOKEN_SECRET,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: "7d",
      secret: process.env.REFRESH_TOKEN_SECRET,
    });
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.userService.addRefreshToken(user.id, hashedToken);

    return { accessToken, refreshToken };
  }
  async validateAccessToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.ACCESS_TOKEN_SECRET,
      });
      if (typeof payload === "object" && payload?.id) {
        const user = await this.userService.customSearch({ id: payload.id });
        if (!user) {
          throw new UnauthorizedException("login on your account");
        }
        return payload;
      }
      throw new UnauthorizedException("login on your account");
    } catch (error) {
      throw new UnauthorizedException("login on your account");
    }
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      if (typeof payload === "object" && payload?.id) {
        const user = await this.userService.customSearch({ id: payload.id });
        if (!user) {
          throw new UnauthorizedException("User not found");
        }
        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isMatch) {
          throw new UnauthorizedException("Invalid refresh token");
        }

        return this.generateTokens(user);
      }
    } catch (error) {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  async logout() {
    const user = await this.request["user"];
    await this.userService.updateUser(user.id, { refreshToken: null });
    return { message: "Logged out successfully" };
  }
}
