import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateCategoryDto, UpdateCategoryDto } from "./dto/category.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Category } from "./entities/category.entity";
import { DeepPartial, Repository } from "typeorm";
import { S3Service } from "../s3/s3.service";
import { paginationDto } from "src/common/dtos/pagination.dto";
import {
  paginationGenerator,
  paginationResolver,
} from "utility/pagination.util";

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private s3Service: S3Service
  ) {}

  /**
   * Creates a new category.
   *
   * @param createCategoryDto - Data Transfer Object containing the details of the category to be created.
   * @param image - The image file associated with the category.
   * @returns A message indicating the category was created successfully.
   * @throws ConflictException - If a category with the given slug already exists.
   */
  async createCategory(
    createCategoryDto: CreateCategoryDto,
    image: Express.Multer.File
  ) {
    const { name, slug, show, parentId } = createCategoryDto;

    const category = await this.findOneBySlug(slug);
    if (category)
      throw new ConflictException("Category with this slug already exists");
    const { Location, Key } = await this.s3Service.uploadFile(
      image,
      "category-image"
    );
    let parentCategory: Category = null;
    if (parentId && !isNaN(parentId)) {
      parentCategory = await this.findOne(parentId);
    }

    await this.categoryRepository.insert({
      name,
      slug,
      show,
      image: Location,
      imageKey: Key,
      parent: parentCategory,
    });

    return { message: "category created  successfully" };
  }

  async findAll(paginationDto: paginationDto) {
    const { page, limit, skip } = paginationResolver(
      paginationDto.page,
      paginationDto.limit
    );
    const [categories, count] = await this.categoryRepository.findAndCount({
      where: {},
      relations: {
        parent: true,
      },
      select: {
        parent: {
          name: true,
        },
      },
      skip,
      take: limit,
      order: { id: "DESC" },
    });
    return { pagination: paginationGenerator(count, page, limit), categories };
  }

  async findOne(id: number, subcategories: boolean = false) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: {
        subcategories,
      },
    });
    if (!category) {
      throw new NotFoundException(`Category not found`);
    }
    return category;
  }

  async findOneBySlug(slug: string) {
    return this.categoryRepository.findOneBy({ slug });
  }
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    image: Express.Multer.File
  ) {
    const { parentId, show, slug, name } = updateCategoryDto;
    const category = await this.findOne(id);
    const updateObject: DeepPartial<Category> = {};
    if (image) {
      const { Location, Key } = await this.s3Service.uploadFile(
        image,
        "category-image"
      );
      if (Location) {
        updateObject["image"] = Location;
        updateObject["imageKey"] = Key;
        await this.s3Service.deleteFile(category?.imageKey);
      }
    }
    if (name) updateObject["name"] = name;
    if (show) updateObject["show"] = show;
    if (parentId && !isNaN(parseInt(parentId.toString()))) {
      const category = await this.categoryRepository.findOneBy({
        id: parentId,
      });
      if (!category) throw new NotFoundException("Parent category not found");
      updateObject["parentId"] = category.id;
    }
    if (slug) {
      const category = await this.findOneBySlug(slug);
      if (category && category.id !== id)
        throw new ConflictException("Category with this slug already exists");
      updateObject["slug"] = slug;
    }
    await this.categoryRepository.update({ id }, updateObject);
    return {
      message: "Category updated successfully",
    };
  }
  async remove(id: number) {
    const category = await this.findOne(id);
    await this.categoryRepository.delete({ id });
    return {
      message: "Category removed successfully",
    };
  }
}
