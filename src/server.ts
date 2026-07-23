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

  const { title, genre_id, language_id, oscar_count, realease_date } = req.body;

  try {
    // case insensitive - se a busca for feita por john wick, John wickl ou JOHN WICK, o registro vai ser retornado na consulta

    // case sensitive - se buscar por john wick e no banco estiver como John wick, não vai ser retornado ma consulta
    const movieWithSameTitle = await prisma.movie.findFirst({
      where: { title: { equals: title, mode: "insensitive" } }
    });

    if (movieWithSameTitle) {
      return res
        .status(409)
        .send({ message: "Já existe um filme cadastrado com esse título" });
    }

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
    res.status(500).send({ message: "falha ao cadastrar um filme" });
    return;
  }
  res.status(201).send("Filme criado");
});

app.listen(port, () => {
  console.log(`servidor rodando em http://localhost:${port}`);
});
