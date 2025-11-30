import { createReview } from "../src/modules/review/review.controller.js";
import prisma from "../src/prismaClient.js";

jest.mock("../src/prismaClient.js", () => ({
  review: {
    create: jest.fn(),
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
}));

describe("Review controller - createReview", () => {
  const mockReq = (body = {}, user = { id: 1 }) => ({ body, user });
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(() => jest.clearAllMocks());

  test("crea review válida", async () => {
    const req = mockReq({ rating: 5, comment: "Excelente", productId: 1 }, { id: 2 });
    const res = mockRes();
    prisma.review.create.mockResolvedValue({ id: 10, rating: 5 });

    await createReview(req, res);

    expect(prisma.review.create).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 10, rating: 5 }));
  });

  test("rechaza rating inválido", async () => {
    const req = mockReq({ rating: 8, productId: 1 }, { id: 2 });
    const res = mockRes();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    expect(prisma.review.create).not.toHaveBeenCalled();
  });
});