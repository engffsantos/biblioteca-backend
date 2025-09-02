# Biblioteca Ars Magica - API Express.js

API backend para o sistema de gerenciamento de biblioteca do RPG Ars Magica.

## Funcionalidades

- **Gerenciamento de Biblioteca**: CRUD completo para itens da biblioteca (Summae, Tractatus, Lab Texts)
- **Gerenciamento de Personagem**: CRUD para dados do personagem Akin (características, artes, habilidades, virtudes, falhas)
- **API RESTful**: Endpoints organizados e documentados
- **CORS habilitado**: Permite integração com frontend React
- **Deploy na Vercel**: Configurado para deploy serverless

## Estrutura do Projeto

```
biblioteca-express/
├── api/                 # Funções serverless (se necessário)
├── data/               # Dados iniciais
│   └── initialData.js  # Dados mock da biblioteca e personagem
├── routes/             # Rotas da API
│   ├── library.js      # Rotas da biblioteca
│   └── akin.js         # Rotas do personagem
├── public/             # Arquivos estáticos
├── index.js            # Servidor principal
├── package.json        # Dependências e scripts
├── vercel.json         # Configuração do Vercel
└── README.md           # Esta documentação
```

## Endpoints da API

### Biblioteca (`/api/library`)

- `GET /api/library` - Listar todos os itens
- `GET /api/library/:id` - Obter item específico
- `POST /api/library` - Criar novo item
- `PUT /api/library/:id` - Atualizar item
- `DELETE /api/library/:id` - Deletar item

### Personagem Akin (`/api/akin`)

- `GET /api/akin` - Obter dados do personagem
- `PUT /api/akin` - Atualizar dados gerais do personagem

#### Habilidades
- `POST /api/akin/abilities` - Adicionar habilidade
- `PUT /api/akin/abilities/:id` - Atualizar habilidade
- `DELETE /api/akin/abilities/:id` - Deletar habilidade

#### Virtudes
- `POST /api/akin/virtues` - Adicionar virtude
- `PUT /api/akin/virtues/:id` - Atualizar virtude
- `DELETE /api/akin/virtues/:id` - Deletar virtude

#### Falhas
- `POST /api/akin/flaws` - Adicionar falha
- `PUT /api/akin/flaws/:id` - Atualizar falha
- `DELETE /api/akin/flaws/:id` - Deletar falha

### Utilitários

- `GET /api/health` - Status da API
- `GET /` - Informações gerais da API

## Instalação e Execução Local

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar em produção
npm start
```

## Deploy na Vercel

1. Instale a CLI da Vercel: `npm i -g vercel`
2. Faça login: `vercel login`
3. Execute o deploy: `vercel`

Ou conecte o repositório diretamente no dashboard da Vercel.

## Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3000)
- `NODE_ENV`: Ambiente de execução

## Tecnologias Utilizadas

- **Node.js**: Runtime JavaScript
- **Express.js**: Framework web
- **CORS**: Middleware para Cross-Origin Resource Sharing
- **Vercel**: Plataforma de deploy serverless

## Estrutura de Dados

### Item da Biblioteca

```javascript
{
  id: string,
  type: 'Summae' | 'Tractatus' | 'Lab Text',
  title: string,
  author: string,
  language: string,
  notes: string,
  createdAt: string,
  updatedAt: string,
  // Campos específicos por tipo:
  subject?: string,     // Summae, Tractatus
  level?: number,       // Summae, Lab Text
  quality?: number,     // Summae, Tractatus
  category?: string,    // Lab Text
  effect?: string,      // Lab Text
  labTotal?: number     // Lab Text
}
```

### Personagem

```javascript
{
  name: string,
  house: string,
  age: number,
  characteristics: {
    int: number, per: number, str: number, sta: number,
    pre: number, com: number, dex: number, qik: number
  },
  arts: {
    creo: number, intellego: number, muto: number, perdo: number, rego: number,
    animal: number, aquam: number, auram: number, corpus: number, herbam: number,
    ignem: number, imaginem: number, mentem: number, terram: number, vim: number
  },
  abilities: Array<{
    id: string,
    name: string,
    value: number,
    specialty?: string
  }>,
  spells: string,
  virtues: Array<{
    id: string,
    name: string,
    description: string,
    isMajor: boolean,
    page?: number
  }>,
  flaws: Array<{
    id: string,
    name: string,
    description: string,
    isMajor: boolean,
    page?: number
  }>,
  notes: string
}
```

