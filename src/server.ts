import express from "express";
import { PrismaClient } from "@prisma/client";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

app.get("/movies", async (_, res) => {
  const movies = await prisma.movie.findMany({
    orderBy: { // define como os filmes devem ser ordenados
      title: "asc"
    },
    include: { // inclui as relações entre tabelas do banco de dados
      genres: true,
      languages: true
    }
  });
  res.json(movies);
});

app.post("/movies", async (req, res) => {
  const { title, genre_id, language_id, oscar_count, realease_date } = req.body;

  try {
    // case insensitive - se a busca for feita por john wick, John wickl ou JOHN WICK, o registro vai ser retornado na consulta

    // case sensitive - se buscar por john wick e no banco estiver como John wick, não vai ser retornado ma consulta


    // o case insensitive serve para garantir que as buscas sejam feitas independente se as letras forem maiúsculas ou minúsculas

    
    const movieWithSameTitle = await prisma.movie.findFirst({
      where: { title: { equals: title, mode: "insensitive" }}
      // a propriedade equals serve para dizer ao prisma que o valor no banco de dados deve ser igual o que foi passado na requisição
    });

    if (movieWithSameTitle) {
      return res
        .status(409)
        .send({ message: "Já existe um filme cadastrado com esse título" });
    }

    // como os nomes dos tipos de dados são os mesmo que eu recebo da requisição, não preciso definir uma chave e valor quando for passar esses valores para o "data"

    // por exemplo, eu não preciso escrever title: title, só o title já basta

    await prisma.movie.create({
      data: {
        title,
        genre_id,
        language_id,
        oscar_count,
        realease_date: new Date(realease_date)
      }
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
      where: { id } // busca um único filme pelo id
    });

    if (!movie) {
      return res.status(404).send({ message: "Filme não encontrado" });
    }
    const data = { ...req.body }; // cria um novo objeto com todos os campos enviados, que será usado na atualização do registro

    // se a data do filme for passada, o código pega ela e transforma numa propriedade de data para o Typescript não interpretar ela como uma string e dar erro no banco, caso não seja passada, o valor retornado é "undefined"

    data.realease_date = data.realease_date
      ? new Date(data.realease_date)
      : undefined;

    await prisma.movie.update({
      where: {
        id
      },
      data: data,
    });
    res.status(200).send("Filme atualizado");
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Falha ao atualizar o registro do filme" });
  }

});

app.delete("/movies/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const movie = await prisma.movie.findUnique({ where: { id } }); // busca um unico filme pelo id

    if (!movie) {
      return res.status(404).send({ message: "Filme não encontrado" });
    }
    console.log(movie);
    await prisma.movie.delete({ where: { id } });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .send({ message: "Nâo foi possível remover o filme" });
  }
  res.status(200).send("Filme deletado com sucesso");
});

app.get("/movies/:genreName", async (req, res) => {
  try {
    const moviesFilteredByGenreName = await prisma.movie.findMany({
      include: {
        genres: true,
        languages: true,
      },
      where: {
        genres: {
          name: {
            equals: req.params.genreName,
            mode: "insensitive", 
          }
        }
      }
    });
    res.status(200).send(moviesFilteredByGenreName);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .send({ message: "Falha ao filtrar filmes por gênero" });
  }
});

app.listen(port, () => {
  console.log(`servidor rodando em http://localhost:${port}`);
});
