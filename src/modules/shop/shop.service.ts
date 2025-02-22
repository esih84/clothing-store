import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Shop } from "./entities/shop.entity";
import { Repository } from "typeorm";
import { CreateShopDto } from "./dto/create-shop.dto";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { RoleService } from "../role/role.service";
import { RoleNames } from "../role/enums/role.enum";
import { ShopOtp } from "./entities/ShopOtp.entity";
import { randomInt } from "crypto";
import { SendOtpDto } from "../auth/dto/send-otp.dto";
import { VerifyOtpDto } from "../auth/dto/verify-otp.dto";

@Injectable({ scope: Scope.REQUEST })
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
    @InjectRepository(ShopOtp)
    private shopOtpRepository: Repository<ShopOtp>,

    private roleService: RoleService,
    @Inject(REQUEST) private request: Request
  ) {}

  async create(createShopDto: CreateShopDto) {
    const { name } = createShopDto;
    const user = this.request["user"];
    //? Check if the shop already exists
    const existingShop = await this.findOneByName(name);
    if (existingShop) {
      throw new ConflictException("Shop already exists");
    }
    //? Create a new shop entity
    const newShop = this.shopRepository.create({ name });
    await this.shopRepository.save(newShop);

    //? Assign the adminShop role to the user
    await this.roleService.assignRolesToUser(
      user.id,
      [RoleNames.ADMIN_SHOP],
      newShop.id
    );
    return {
      message: "Shop created successfully",
      shop: newShop,
    };
  }
  async findOneByName(name: string) {
    const shop = await this.shopRepository.findOneBy({ name });
    return shop;
  }
  async findOneById(shopId: number) {
    const shop = await this.shopRepository.findOneBy({ id: shopId });
    if (!shop) {
      throw new ConflictException("Shop not found");
    }
    return shop;
  }
  async findOneByMobile(phoneNumber: string) {
    return await this.shopRepository.findOneBy({ phoneNumber });
  }
  /**
   * Sends an OTP (One-Time Password) to the specified shop's mobile number.
   *
   * @param shopId - The ID of the shop to which the OTP is to be sent.
   * @param sendOtpDto - Data transfer object containing the mobile number to which the OTP is to be sent.
   *
   * @throws {ConflictException} If the mobile number is already associated with another shop.
   * @throws {ConflictException} If the mobile number is the same as the user's phone number.
   *
   * @returns An object containing a success message indicating that the OTP was sent successfully.
   */
  async sendShopOtp(shopId: number, sendOtpDto: SendOtpDto) {
    const { mobile } = sendOtpDto;
    const user = this.request["user"];
    const existingShopWithMobile = await this.findOneByMobile(mobile);

    if (!!existingShopWithMobile && existingShopWithMobile.id !== shopId) {
      throw new ConflictException(
        "Phone number already associated with another shop"
      );
    }
    if (mobile === user.phone) {
      throw new ConflictException(
        "Phone number is the same as the user's phone number"
      );
    }
    const shop =
      existingShopWithMobile?.id === shopId
        ? existingShopWithMobile
        : await this.findOneById(shopId);
    shop.phoneNumber = mobile;
    await this.shopRepository.save(shop);
    //*Checking whether the user has access to this store is checked in guard
    await this.generateOtpCode(shop);

    return {
      message: "OTP sent successfully",
    };
  }
  async generateOtpCode(shop: Shop) {
    const otpCode = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 2);
    let otp = await this.shopOtpRepository.findOneBy({ shopId: shop.id });
    if (otp) {
      if (otp.expiresAt > new Date()) {
        throw new BadRequestException("The otp code has not expired");
      }
      otp.code = otpCode;
      otp.expiresAt = expiresAt;
    } else {
      otp = this.shopOtpRepository.create({
        code: otpCode,
        expiresAt,
        shopId: shop.id,
      });
    }
    console.log(otpCode);
    await this.shopOtpRepository.save(otp);
  }

  /**
   * Verifies the OTP (One-Time Password) sent to the shop's mobile number.
   *
   * @param shopId - The ID of the shop to which the OTP was sent.
   * @param verifyOtpDto - Data transfer object containing the mobile number and OTP code to be verified.
   *
   * @throws {BadRequestException} If the shop is not found.
   * @throws {ConflictException} If the OTP is invalid or expired.
   *
   * @returns An object containing a success message indicating that the phone number was verified successfully.
   */
  async verifyShopOtp(shopId: number, verifyOtpDto: VerifyOtpDto) {
    const { mobile, code } = verifyOtpDto;
    const shop = await this.shopRepository.findOneBy({
      phoneNumber: mobile,
      id: shopId,
    });
    if (!shop) {
      throw new BadRequestException("shop not found");
    }
    const shopOtp = await this.shopOtpRepository.findOne({
      where: { shop: { id: shop.id, phoneNumber: shop.phoneNumber } },
    });
    if (!shopOtp || shopOtp.code !== code || shopOtp.expiresAt < new Date()) {
      throw new ConflictException("Invalid or expired OTP");
    }

    if (!shop.isPhoneVerified) {
      await this.shopRepository.update(
        { id: shop.id },
        { isPhoneVerified: true }
      );
    }
    await this.shopOtpRepository.delete({ id: shopOtp.id });

    return {
      message: "Phone number verified successfully",
    };
  }
}
