import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Scope,
} from "@nestjs/common";
import { UpdateProfileDto } from "./dto/profile.dto";
import { REQUEST } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Profile } from "./entities/profile.entity";
import { Repository } from "typeorm";
import { S3Service } from "../s3/s3.service";

@Injectable({ scope: Scope.REQUEST })
export class ProfileService {
  constructor(
    @Inject(REQUEST) private request: Request,
    @InjectRepository(Profile)
    private profileEntity: Repository<Profile>,
    private s3Service: S3Service
  ) {}
  async findUserProfile() {
    const { id: userId } = this.request["user"];
    const profile = await this.findOneByUserId(userId);
    return profile;
  }

  async findOneByUserId(userId: number) {
    //TODO: remove deleteAt from response
    const profile = await this.profileEntity.findOneBy({ userId });
    if (!profile) {
      throw new BadRequestException("profile not found");
    }
    return profile;
  }
  async checkProfileByUsername(username: string) {
    const profile = await this.profileEntity.findOneBy({ username });

    return profile;
  }

  async update(
    updateProfileDto: UpdateProfileDto,
    avatar: Express.Multer.File
  ) {
    const { bio, birthday, username } = updateProfileDto;
    const { id: userId } = this.request["user"];
    const profile = await this.findOneByUserId(userId);

    if (avatar && avatar[0]) {
      // Delete the old avatar from S3 if it exists
      if (profile.avatarKey) {
        await this.s3Service.deleteFile(profile.avatarKey);
      }

      const { Location, Key } = await this.s3Service.uploadFile(
        avatar[0],
        "profile_avatar"
      );
      profile.avatar = Location;
      profile.avatarKey = Key;
    }

    if (username && username.trim() !== "") {
      const isUserNameExist = await this.checkProfileByUsername(username);
      if (isUserNameExist && isUserNameExist.id !== profile.id) {
        throw new ConflictException("Username already exists");
      }

      profile.username = username;
    }
    if (bio && bio.trim() !== "") profile.bio = bio;
    if (birthday) {
      profile.birthday = new Date(birthday);
    }
    await this.profileEntity.save(profile);
    return {
      message: "profile updated successfully.",
    };
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
