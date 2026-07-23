import express from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/movies", async (_, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: {
      title: "asc",
    },
    include: {
      genres: true,
      languages: true,
    },
  });
  res.json(movies);
});

app.post("/movies", async (req, res) => {
  console.log(`Conteúdo do body da requisição ${req.body.title}`);

  const { title, genre_id, language_id, oscar_count, realease_date } = req.body;

  try {
    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        realease_date: new Date(realease_date),
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ mensage: "falha ao cadastrar um filme" });
    return;
  }
  res.status(201).send("Filme criado");
});

app.listen(port, () => {
  console.log(`servidor rodando em http://localhost:${port}`);
});