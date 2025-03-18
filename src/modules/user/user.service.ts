import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from "@nestjs/common";
import { CreateUserDto, UpdateUserIdentityDto } from "./dto/create-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { FindOptionsRelations, FindOptionsWhere, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { S3Service } from "../s3/s3.service";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { UserDocument } from "./entities/user-document.entity";
import { UserDocumentType } from "./enums/user-document.enum";
import { UserStatus } from "./enums/user-status.enum";

@Injectable({ scope: Scope.REQUEST })
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserDocument)
    private userDocumentRepository: Repository<UserDocument>,
    private s3Service: S3Service,
    @Inject(REQUEST) private request: Request
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { mobile } = createUserDto;
    let user = await this.findOneByMobile(mobile);
    if (!user) {
      user = this.userRepository.create({ mobile });
    }
    await this.userRepository.save(user);
    return user;
  }

  findAll() {
    return `This action returns all user`;
  }

  async customSearch(
    where: FindOptionsWhere<User>,
    relations?: FindOptionsRelations<User>
  ) {
    return await this.userRepository.findOne({ where, relations });
  }
  async findOneByMobile(mobile: string) {
    return await this.userRepository.findOneBy({ mobile });
  }
  async verifyMobile(userId: number) {
    await this.userRepository.update({ id: userId }, { isVerified: true });
  }
  async addRefreshToken(userId: number, refreshToken) {
    await this.userRepository.update({ id: userId }, { refreshToken });
  }
  async updateUser(
    criteria: FindOptionsWhere<User>,
    data: QueryDeepPartialEntity<User>
  ) {
    const user = await this.customSearch(criteria);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await this.userRepository.update(criteria, data);
  }

  async uploadUserNationalCard(file: Express.Multer.File) {
    const { userId } = this.request["user"];
    const user = await this.customSearch({ id: userId });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (
      [
        UserStatus.VERIFIED,
        UserStatus.UPLOADED_ALL_DOCUMENTS,
        UserStatus.UPLOADED_NATIONAL_CARD,
      ].includes(user.status)
    ) {
      throw new ForbiddenException("user has already uploaded all documents.");
    }
    const { Location } = await this.s3Service.uploadFile(
      file[0],
      "user-documents"
    );

    const userDocument = this.userDocumentRepository.create({
      userId: user.id,
      fileUrl: Location,
      documentType: UserDocumentType.NATIONAL_CARD,
      isActive: true,
    });

    await this.userDocumentRepository.save(userDocument);
    let newStatus: UserStatus;
    if (user.status === UserStatus.UPLOAD_INFORMATION) {
      newStatus = UserStatus.UPLOADED_ALL_DOCUMENTS;
    } else {
      newStatus = UserStatus.UPLOADED_NATIONAL_CARD;
    }
    await this.updateUser({ id: user.id }, { status: newStatus });
    return { message: "user national card uploaded successfully" };
  }

  /**
   * Updates the user's real name and family and changes the user's status accordingly.
   *
   * If the user's current status is UPLOADED_NATIONAL_CARD, it will be updated to UPLOADED_ALL_DOCUMENTS;
   * otherwise, the status is updated to UPLOAD_INFORMATION.
   *
   * @param updateUserIdentityDto - DTO containing the realName and realFamily.
   * @returns The updated user.
   * @throws NotFoundException if the user is not found.
   * @throws ForbiddenException if the user already uploaded all documents.
   * @throws BadRequestException if the provided realName or realFamily is empty.
   */
  async updateUserIdentityDto(updateUserIdentityDto: UpdateUserIdentityDto) {
    const { userId } = this.request["user"];
    const { realFamily, realName } = updateUserIdentityDto;
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (
      [
        UserStatus.VERIFIED,
        UserStatus.UPLOADED_ALL_DOCUMENTS,
        UserStatus.UPLOAD_INFORMATION,
      ].includes(user.status)
    ) {
      throw new ForbiddenException("user has already uploaded all documents.");
    }
    if (!realName || realName.trim() === "") {
      throw new BadRequestException("Real name must not be empty.");
    }
    if (!realFamily || realFamily.trim() === "") {
      throw new BadRequestException("Real family name must not be empty.");
    }
    user.realName = realName;
    user.realFamily = realFamily;

    let newStatus: UserStatus;
    if (user.status === UserStatus.UPLOADED_NATIONAL_CARD) {
      newStatus = UserStatus.UPLOADED_ALL_DOCUMENTS;
    } else {
      newStatus = UserStatus.UPLOAD_INFORMATION;
    }
    user.status = newStatus;
    await this.userRepository.save(user);
    return { message: "User identity updated successfully." };
  }
}
