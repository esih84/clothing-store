import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
} from "@nestjs/common";
import { CreateBlogDto, UpdateBlogDto } from "../dto/blog.dto";
import { Repository } from "typeorm";
import { Blog } from "../entities/blog.entity";
import { ShopService } from "../../shop/services/shop.service";
import { REQUEST } from "@nestjs/core";
import { Request } from "express";
import { CategoryService } from "../../category/category.service";
import { InjectRepository } from "@nestjs/typeorm";
import { createSlug, randomId } from "utility/function.util";
import { S3Service } from "src/modules/s3/s3.service";
import { isArray } from "class-validator";
import { BlogCategory } from "../entities/blog-category.entity";
import { Shop } from "src/modules/shop/entities/shop.entity";
@Injectable({ scope: Scope.REQUEST })
export class BlogService {
  constructor(
    @InjectRepository(Blog)
    private blogRepository: Repository<Blog>,
    @InjectRepository(BlogCategory)
    private blogCategoryRepository: Repository<BlogCategory>,
    private s3Service: S3Service,
    private readonly shopService: ShopService,
    private readonly categoryService: CategoryService,
    @Inject(REQUEST) private request: Request
  ) {}

  /**
   * Creates a new blog post with image upload and category associations
   *
   * @param createBlogDto - Data Transfer Object containing blog metadata and content
   * @param image - Uploaded image file via Multer middleware
   * @param shopId - Optional ID for shop association (for shop-specific blogs)
   * @returns Success message object
   * @throws BadRequestException - For:
   * - Invalid categories format
   * - Non-numeric category IDs
   * - Slug generation failures
   * @throws NotFoundException - If:
   * - Associated shop not found
   * - Shop category not found
   * @throws ConflictException - If generated slug already exists
   */
  async create(
    createBlogDto: CreateBlogDto,
    image: Express.Multer.File,
    shopId?: number
  ) {
    const user = this.request["user"];
    let shop: Shop | null = null;
    if (shopId) {
      shop = await this.shopService.findOneById(shopId);
    }

    let { title, content, description, categories, slug, status } =
      createBlogDto;

    if (!isArray(categories) && typeof categories === "string") {
      categories = categories.split(",");
    } else if (!isArray(categories)) {
      throw new BadRequestException("Enter the categories correctly.");
    }
    const { Location, Key } = await this.s3Service.uploadFile(
      image[0],
      "blog_image"
    );

    let slugData = slug ?? title;
    slug = createSlug(slugData);
    const isSlugExist = await this.checkBlogBySlug(slug);
    if (isSlugExist) {
      slug = slug + `${randomId()}`;
    }

    //* Create and persist blog entity
    let blog = this.blogRepository.create({
      title,
      slug,
      content,
      description,
      shopId: shopId ?? null,
      status,
      image: Location,
      imageKey: Key,
      authorId: user.id,
    });
    blog = await this.blogRepository.save(blog);

    let allowedCategories: number[] | null = null;
    if (shop) {
      const shopCategory = await this.categoryService.findOne(
        shop.categoryId,
        true
      );

      allowedCategories = shopCategory.subcategories.reduce(
        (acc, sub) => [...acc, sub.id],
        [shopCategory.id]
      );
    }

    for (let categoryId of allowedCategories ?? categories) {
      if (isNaN(parseInt(categoryId.toString()))) {
        throw new BadRequestException();
      }
      const category = await this.categoryService.findOne(+categoryId);

      await this.blogCategoryRepository.insert({
        blogId: blog.id,
        categoryId: +category.id,
      });
    }
    return {
      message: "blog created successfully.",
    };
  }

  async checkBlogBySlug(slug: string) {
    const blog = await this.blogRepository.findOneBy({ slug });
    return blog;
  }

  async findOneWithSlug(slug: string) {
    const blog = await this.blogRepository.findOneBy({ slug });
    if (!blog) {
      throw new NotFoundException("blog not found");
    }
  }

  async findOneWithId(id: number) {
    const blog = await this.blogRepository.findOneBy({ id });
    if (!blog) {
      throw new NotFoundException("blog not found");
    }
  }
  findAll() {
    return `This action returns all blog`;
  }

  findOne(id: number) {
    return `This action returns a #${id} blog`;
  }

  update(id: number, updateBlogDto: UpdateBlogDto) {
    return `This action updates a #${id} blog`;
  }

  remove(id: number) {
    return `This action removes a #${id} blog`;
  }
}
