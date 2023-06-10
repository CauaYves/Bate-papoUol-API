# API de bate papo - Documentação do Usuário

## rotas

### POST /participants

Deve receber (pelo body do request), um parâmetro name, contendo o nome do participante a ser cadastrado na sala:
```
{
name: "João"
}
```
#### erros: 
422 caso name esteja vazio
409 caso o nome ja esteja em uso

as mensagens de chat seguem este formato:
```
{
from: 'nome',
to: 'Todos',
text: 'entra na sala...',
type: 'status',
time: 'HH:mm:ss'
}
```
#### respostas:

201 mensagem criada e salva no banco

### GET /participants

Retorna a lista de todos os participantes.

### POST /messages
```
{
to: "Maria",
text: "oi sumida rs",
type: "private_message"
}
```
o from da mensagem é enviado por um Header chamado User.

#### errors:
422 erro ao postar mensagem

#### respostas:
201 mensagem criada com sucesso

### GET /messages

Retornar as mensagens:

O back-end só deve entregar as mensagens que aquele usuário poderia ver. Ou seja: deve entregar todas as mensagens públicas, todas as mensagens com o remetente \***\*“Todos” \*\***e todas as mensagens privadas enviadas para ele (to) ou por ele (from).
Para isso, o cliente envia um header User para identificar quem está fazendo a requisição.

```http://localhost:5000/messages?limit=100```

Caso não seja informado um limit, todas as mensagens são retornadas.

Caso tenha sido fornecido um limit, por exemplo 100, somente as últimas 100 mensagens mais recentes são retornadas.

#### erros:
422 caso o limite seja invalido

### POST /status

recebe um header na requisição, chamado User, contendo o nome do participante a ser atualizado.

#### erros:
404 caso o header seja nulo
#### respostas:
200 laststatus do participante atualizado com sucesso
