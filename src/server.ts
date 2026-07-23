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
      where: { title: { equals: title, mode: "insensitive" } },
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

app.put("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const movie = await prisma.movie.findUnique({
      where: {
        id,
      },
    });

    if (!movie) {
      return res.status(404).send({ message: "Filme não encontrado" });
    }
    const data = { ...req.body };
    data.realease_date = data.realease_date
      ? new Date(data.realease_date)
      : undefined;

    console.log(data);
    // pegar o id do registro que será atualizado

    // pegar os dados do filme que será atualizado e atualizar ele no prisma
    await prisma.movie.update({
      where: {
        id,
      },
      data: data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Falha ao atualizar o registro do filme" });
  }
  // retornar o status correto informando que o filme foi atualizado

  res.status(200).send("Filme atualizado");
});

app.listen(port, () => {
  console.log(`servidor rodando em http://localhost:${port}`);
});
