Este projeto foi realizado como parte da atividade referente ao conteúdo abordado sobre Smart Contracts durante o curso de Web3.0 - Residência em TIC 29, que é programa de Capacitação e Residência Tecnológica financiado e promovido pelo Ministério da Ciência, Tecnologia e Inovação (MCTI), Coordenado pela Softex e realizado pelo Instituto de Gestão, Redes Tecnológicas e Energia (IREDE) para a formação de profissionais de alto nível para o mercado emergente da Web 3.0.

Foi desenvolvido um MVP (Projeto Mínimo Viável) com as seguintes características:
      Problema que resolve: falta de engajamento e envolvimento de moradores de determinado bairro com a política local (projetos da subprefeitura correspondente)
      Solução: criar uma DAO de governança on-chain onde cada morador de um determinado bairro recebe NFT de membro para propor ou votar os projetos relevantes para a sua necessidade, sendo recompensado por engajamento. 
	    As regras são: só quem tem NFT pode propor e votar (1 NFT corresponde a um voto) e a recompensa depende de staking do NFT e participação. 


O fluxo lógico é:
 
 - Adm cria NFT para moradores (no caso o adm é a subprefeitura);
 
 - Usuário recebe NFT;
 
 - Usuário faz staking e, com isso, cria uma proposta ou vota (as propostas criadas passam por validação da subprefeitura antes de serem votadas e quem cria a proposta não vota);
 
 - O NFT é devolvido e ele recebe a recompensa (variável, de acordo com o valor do ETH).
 
Dentro das propostas de estudos de caso apresentadas durante o curso o aplicado neste projeto se enquadra como gestão de contratos e documentos com validação on-chain.
Foi feita a implementação utilizando a testnet da Sepholia, auditoria de contratos inteligentes utilizando Slither e Hardhat, integração com oráculo Chainlink e frontend para a interação (Github Pages).


