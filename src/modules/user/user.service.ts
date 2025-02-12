import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { FindOptionsRelations, FindOptionsWhere, Repository } from "typeorm";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
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
}
