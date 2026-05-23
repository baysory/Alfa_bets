  // --- ESTADO GLOBAL DA PLATAFORMA ---
        let estado = {
            usuario: null,
            saldoCarteira: 1000.00,
            abaAtiva: 'esportes',
            minhasApostas: [],
            boletim: null,
            jogosAoVivo: [
                { id: 1, equipeCasa: 'FC Porto', equipeFora: 'SL Benfica', golsCasa: 1, golsFora: 0, cotacaoCasa: 2.10, cotacaoEmpate: 3.30, cotacaoFora: 2.95, tempoDeJogo: "72'" },
                { id: 2, equipeCasa: 'Sporting CP', equipeFora: 'SC Braga', golsCasa: 2, golsFora: 2, cotacaoCasa: 1.85, cotacaoEmpate: 3.55, cotacaoFora: 3.60, tempoDeJogo: "54'" },
                { id: 3, equipeCasa: 'Real Madrid', equipeFora: 'Barcelona', golsCasa: 0, golsFora: 1, cotacaoCasa: 2.40, cotacaoEmpate: 3.25, cotacaoFora: 2.60, tempoDeJogo: "31'" },
                { id: 4, equipeCasa: 'Man. City', equipeFora: 'Liverpool', golsCasa: 3, golsFora: 2, cotacaoCasa: 1.70, cotacaoEmpate: 3.80, cotacaoFora: 4.10, tempoDeJogo: "85'" }
            ],
            crash: {
                estado: 'ocioso',
                multiplicador: 1.00,
                valorAposta: 10.00,
                alvoExplosao: 0,
                quadroAnimacao: null,
                tempoInicio: null,
                particulasRastro: [],
                particulasExplosao: []
            },
            roleta: {
                estado: 'ocioso',
                valorAposta: 10.00,
                corApostada: 'verde',
                alvoScroll: 0,
                scrollAtual: 0,
                velocidade: 0,
                quadroAnimacao: null,
                fita: [],
                larguraBloco: 80,
                resultadoCor: '',
                resultadoNumero: 0
            }
        };

        // --- CADASTRO, LOGIN E LOGOUT ---
        function executarCadastro(event) {
            event.preventDefault();
            const nome = document.getElementById('cadastro-nome').value.trim();
            const cpf = document.getElementById('cadastro-cpf').value.trim();
            const email = document.getElementById('cadastro-email').value.trim();
            
            estado.usuario = { nome, email, cpf };
            const primeiroNome = nome.split(' ')[0];
            
            document.getElementById('tela-cadastro').classList.add('hidden');
            document.getElementById('painel-principal').classList.remove('hidden');
            document.getElementById('saudacao-usuario').innerText = `Olá, ${primeiroNome}! (Simulador)`;

            atualizarExibicaoSaldo();
            renderizarJogosAoVivo();
            prepararFitaRoleta();
            desenharEstadoInicialRoleta();
            mostrarNotificacao(`Bem-vindo, ${primeiroNome}!`);
            
            popularHistoricosIniciais();
        }

        function sairDaConta() {
            estado.usuario = null;
            estado.saldoCarteira = 1000.00;
            estado.minhasApostas = [];
            
            limparBoletim();
            document.getElementById('formulario-cadastro').reset();
            document.getElementById('painel-principal').classList.add('hidden');
            document.getElementById('tela-cadastro').classList.remove('hidden');
            
            const histCrash = document.getElementById('historico-resultados-crash');
            const histRoleta = document.getElementById('historico-resultados-roleta');
            if (histCrash) histCrash.innerHTML = '';
            if (histRoleta) histRoleta.innerHTML = '';
            
            mudarAba('esportes');
            mostrarNotificacao('Você saiu da conta com sucesso.', 'success');
        }

        // --- NOTIFICAÇÕES (TOASTS) ---
        function mostrarNotificacao(mensagem, tipo = 'success') {
            const container = document.getElementById('container-notificacoes');
            if (!container) return;
            const toast = document.createElement('div');
            
            let icon = '<i class="fa-solid fa-circle-check"></i>';
            let classeFundo = 'bg-marca-primaria/10 text-marca-primaria border-marca-primaria/20';
            
            if (tipo === 'warning') {
                icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
                classeFundo = 'bg-marca-primaria/15 text-marca-primaria border-marca-primaria/30';
            } else if (tipo === 'danger') {
                icon = '<i class="fa-solid fa-circle-xmark"></i>';
                classeFundo = 'bg-marca-primaria/20 text-marca-primaria border-marca-primaria/40';
            }

            toast.className = `flex items-center gap-3 border ${classeFundo} px-4 py-3.5 rounded-xl shadow-lg text-xs font-semibold transform translate-y-2 opacity-0 transition-all duration-300 pointer-events-auto`;
            toast.innerHTML = `${icon} <span>${mensagem}</span>`;
            container.appendChild(toast);
            
            setTimeout(() => toast.classList.remove('translate-y-2', 'opacity-0'), 50);
            setTimeout(() => {
                toast.classList.add('opacity-0', 'translate-y-[-10px]');
                setTimeout(() => toast.remove(), 300);
            }, 4500);
        }

        // --- FINANCEIRO (DEPÓSITO E SAQUE) ---
        function atualizarExibicaoSaldo() {
            const display = document.getElementById('saldo-exibido');
            if (display) display.innerText = `R$ ${estado.saldoCarteira.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        function alternarModalDeposito() {
            document.getElementById('modal-deposito').classList.toggle('hidden');
        }

        function definirValorDeposito(valor) {
            document.getElementById('entrada-deposito').value = valor;
        }

        function confirmarDeposito() {
            const valor = parseFloat(document.getElementById('entrada-deposito').value);
            if (isNaN(valor) || valor <= 0) {
                mostrarNotificacao('Insira um valor de depósito válido.', 'danger');
                return;
            }
            estado.saldoCarteira += valor;
            atualizarExibicaoSaldo();
            alternarModalDeposito();
            mostrarNotificacao(`Depósito fictício de R$ ${valor.toFixed(2)} efetuado com sucesso!`);
        }

        function abrirModalSaque() {
            const inputCpf = document.getElementById('saque-cpf');
            if(inputCpf) inputCpf.value = estado.usuario ? estado.usuario.cpf : '';
            document.getElementById('modal-saque').classList.remove('hidden');
        }

        function fecharModalSaque() {
            document.getElementById('modal-saque').classList.add('hidden');
        }

        function confirmarSaque() {
            const valor = parseFloat(document.getElementById('entrada-saque').value);
            if (isNaN(valor) || valor <= 0) {
                mostrarNotificacao('Insira um valor de saque válido.', 'danger');
                return;
            }
            if (valor > estado.saldoCarteira) {
                mostrarNotificacao('Saldo insuficiente para o saque solicitado!', 'danger');
                return;
            }
            estado.saldoCarteira -= valor;
            atualizarExibicaoSaldo();
            fecharModalSaque();
            mostrarNotificacao(`Saque PIX de R$ ${valor.toFixed(2)} processado com sucesso!`, 'success');
        }

        // --- NAVEGAÇÃO ENTRE ABAS ---
        function mudarAba(nomeAba) {
            estado.abaAtiva = nomeAba;
            document.querySelectorAll('.aba-painel').forEach(el => el.classList.add('hidden'));
            
            if (nomeAba === 'esportes') document.getElementById('aba-conteudo-esportes').classList.remove('hidden');
            else if (nomeAba === 'cassino') document.getElementById('aba-conteudo-cassino').classList.remove('hidden');
            else if (nomeAba === 'minhas-apostas') document.getElementById('aba-conteudo-minhas-apostas').classList.remove('hidden');

            document.querySelectorAll('.aba-navegacao-botao').forEach(botao => {
                if (botao.getAttribute('data-aba') === nomeAba) {
                    botao.classList.add('text-marca-primaria', 'bg-marca-fundoCard', 'shadow');
                    botao.classList.remove('text-slate-400', 'hover:text-slate-100');
                } else {
                    botao.classList.remove('text-marca-primaria', 'bg-marca-fundoCard', 'shadow');
                    botao.classList.add('text-slate-400', 'hover:text-slate-100');
                }
            });

            document.querySelectorAll('.celular-navegacao-botao').forEach(botao => {
                if (botao.getAttribute('data-aba-celular') === nomeAba) {
                    botao.classList.add('text-marca-primaria');
                    botao.classList.remove('text-slate-400');
                } else {
                    botao.classList.remove('text-marca-primaria');
                    botao.classList.add('text-slate-400');
                }
            });

            if (nomeAba === 'cassino') {
                setTimeout(() => {
                    redimensionarCanvasCrash();
                    desenharEstadoInicialCanvas();
                    redimensionarCanvasRoleta();
                    desenharEstadoInicialRoleta();
                }, 50);
            }
        }

        function alternarJogoAtivoCassino(jogo) {
            const painelFoguete = document.getElementById('painel-jogo-foguete');
            const painelRoleta = document.getElementById('painel-jogo-roleta');
            const btnFoguete = document.getElementById('aba-sub-foguete');
            const btnRoleta = document.getElementById('aba-sub-roleta');

            if (jogo === 'foguete') {
                painelFoguete.classList.remove('hidden');
                painelRoleta.classList.add('hidden');
                btnFoguete.className = "bg-marca-primaria text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md";
                btnRoleta.className = "bg-marca-fundoCard hover:bg-marca-borda text-slate-400 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all";
                setTimeout(() => { redimensionarCanvasCrash(); desenharEstadoInicialCanvas(); }, 10);
            } else {
                painelFoguete.classList.add('hidden');
                painelRoleta.classList.remove('hidden');
                btnRoleta.className = "bg-marca-primaria text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md";
                btnFoguete.className = "bg-marca-fundoCard hover:bg-marca-borda text-slate-400 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all";
                setTimeout(() => { redimensionarCanvasRoleta(); desenharEstadoInicialRoleta(); }, 10);
            }
        }

        // --- ESPORTES (FUTEBOL) ---
        function renderizarJogosAoVivo() {
            const container = document.getElementById('container-jogos-ao-vivo');
            if (!container) return;
            container.innerHTML = '';

            estado.jogosAoVivo.forEach(jogo => {
                const card = document.createElement('div');
                card.className = 'bg-marca-fundoCard border border-marca-borda rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-4 hover:border-marca-primaria/25 transition-all';
                card.innerHTML = `
                    <div class="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto">
                        <span class="text-[9px] text-marca-primaria font-black bg-marca-primaria/10 px-2 py-1 rounded border border-marca-primaria/20 flex items-center gap-1 shrink-0 uppercase tracking-wider">
                            <span class="inline-block w-1.5 h-1.5 bg-marca-primaria rounded-full animate-pulse"></span> Ao Vivo
                        </span>
                        <div class="flex items-center gap-2">
                            <div class="text-right">
                                <h4 class="font-bold text-xs text-slate-200">${jogo.equipeCasa}</h4>
                                <h4 class="font-bold text-xs text-slate-200 mt-1">${jogo.equipeFora}</h4>
                            </div>
                            <div class="bg-marca-fundoEscuro px-2.5 py-1.5 rounded-lg text-center font-black border border-marca-borda shrink-0">
                                <span class="text-marca-primaria text-xs">${jogo.golsCasa} - ${jogo.golsFora}</span>
                            </div>
                        </div>
                        <span class="text-[10px] text-slate-400 ml-3">${jogo.tempoDeJogo}</span>
                    </div>
                    <div class="grid grid-cols-3 gap-2 w-full lg:w-96">
                        <button onclick="selecionarCotacao(${jogo.id}, 'casa', ${jogo.cotacaoCasa})" class="odd-btn bg-marca-fundoEscuro hover:bg-marca-borda border border-marca-borda py-2.5 px-3 rounded-xl flex items-center justify-between transition-all" id="cotacao-${jogo.id}-casa">
                            <span class="text-[10px] font-bold text-slate-500">1</span>
                            <span class="text-xs font-black text-marca-primaria">${jogo.cotacaoCasa.toFixed(2)}</span>
                        </button>
                        <button onclick="selecionarCotacao(${jogo.id}, 'empate', ${jogo.cotacaoEmpate})" class="odd-btn bg-marca-fundoEscuro hover:bg-marca-borda border border-marca-borda py-2.5 px-3 rounded-xl flex items-center justify-between transition-all" id="cotacao-${jogo.id}-empate">
                            <span class="text-[10px] font-bold text-slate-500">X</span>
                            <span class="text-xs font-black text-marca-primaria">${jogo.cotacaoEmpate.toFixed(2)}</span>
                        </button>
                        <button onclick="selecionarCotacao(${jogo.id}, 'fora', ${jogo.cotacaoFora})" class="odd-btn bg-marca-fundoEscuro hover:bg-marca-borda border border-marca-borda py-2.5 px-3 rounded-xl flex items-center justify-between transition-all" id="cotacao-${jogo.id}-fora">
                            <span class="text-[10px] font-bold text-slate-500">2</span>
                            <span class="text-xs font-black text-marca-primaria">${jogo.cotacaoFora.toFixed(2)}</span>
                        </button>
                    </div>`;
                container.appendChild(card);
            });
            atualizarVisualCotacoesSelecionadas();
        }

        function iniciarOscilacaoDeCotacoes() {
            setInterval(() => {
                estado.jogosAoVivo.forEach(jogo => {
                    jogo.cotacaoCasa = Math.max(1.05, jogo.cotacaoCasa + (Math.random() * 0.16 - 0.08));
                    jogo.cotacaoEmpate = Math.max(1.05, jogo.cotacaoEmpate + (Math.random() * 0.16 - 0.08));
                    jogo.cotacaoFora = Math.max(1.05, jogo.cotacaoFora + (Math.random() * 0.16 - 0.08));
                });
                renderizarJogosAoVivo();
                
                if (estado.boletim) {
                    const jogoAtivo = estado.jogosAoVivo.find(j => j.id === estado.boletim.idJogo);
                    if (jogoAtivo) {
                        const mapaTipos = { 'casa': 'cotacaoCasa', 'empate': 'cotacaoEmpate', 'fora': 'cotacaoFora' };
                        estado.boletim.odds = jogoAtivo[mapaTipos[estado.boletim.tipo]];
                        renderizarBoletim();
                    }
                }
            }, 5000);
        }

        // --- BOLETIM DE APOSTAS ---
        function selecionarCotacao(idJogo, tipo, odds) {
            const jogo = estado.jogosAoVivo.find(j => j.id === idJogo);
            if (!jogo) return;

            let nomeSelecao = 'Empate';
            if (tipo === 'casa') nomeSelecao = jogo.equipeCasa;
            if (tipo === 'fora') nomeSelecao = jogo.equipeFora;

            estado.boletim = { idJogo: jogo.id, nomeJogo: `${jogo.equipeCasa} vs ${jogo.equipeFora}`, selecao: nomeSelecao, odds: odds, tipo: tipo };

            renderizarBoletim();
            atualizarVisualCotacoesSelecionadas();
            mostrarNotificacao(`Boletim atualizado: ${nomeSelecao}`);

            document.getElementById('contador-boletim').innerText = '1';
            document.getElementById('distintivo-apostas-ativas').innerText = '1';
            document.getElementById('distintivo-apostas-ativas').classList.remove('hidden');
            document.getElementById('distintivo-boletim-celular').innerText = '1';
            document.getElementById('distintivo-boletim-celular').classList.remove('hidden');
        }

        function atualizarVisualCotacoesSelecionadas() {
            document.querySelectorAll('.odd-btn').forEach(btn => btn.classList.remove('border-marca-primaria', 'bg-marca-primaria/10'));
            if (estado.boletim) {
                const elemento = document.getElementById(`cotacao-${estado.boletim.idJogo}-${estado.boletim.tipo}`);
                if (elemento) elemento.classList.add('border-marca-primaria', 'bg-marca-primaria/10');
            }
        }

        function limparBoletim() {
            estado.boletim = null;
            renderizarBoletim();
            atualizarVisualCotacoesSelecionadas();
            document.getElementById('contador-boletim').innerText = '0';
            document.getElementById('distintivo-apostas-ativas').classList.add('hidden');
            document.getElementById('distintivo-boletim-celular').classList.add('hidden');
        }

        function renderizarBoletim() {
            const elVazio = document.getElementById('boletim-vazio');
            const elAtivo = document.getElementById('boletim-ativo');
            
            if (!elVazio || !elAtivo) return;

            if (!estado.boletim) {
                elVazio.classList.remove('hidden');
                elAtivo.classList.add('hidden');
                return;
            }
            elVazio.classList.add('hidden');
            elAtivo.classList.remove('hidden');
            document.getElementById('boletim-jogo').innerText = estado.boletim.nomeJogo;
            document.getElementById('boletim-selecao').innerText = `Vencedor: ${estado.boletim.selecao}`;
            document.getElementById('boletim-odds').innerText = estado.boletim.odds.toFixed(2);
            document.getElementById('boletim-calc-odds').innerText = estado.boletim.odds.toFixed(2);
            calcularRetornoBoletim();
        }

        function calcularRetornoBoletim() {
            if (!estado.boletim) return;
            let valor = parseFloat(document.getElementById('valor-aposta-boletim').value);
            if (isNaN(valor) || valor < 0) valor = 0;
            document.getElementById('boletim-calc-retorno').innerText = `R$ ${(valor * estado.boletim.odds).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        function definirValorMaximoBoletim() {
            document.getElementById('valor-aposta-boletim').value = Math.min(estado.saldoCarteira, 5000).toFixed(2);
            calcularRetornoBoletim();
        }

        function registrarApostaBoletim() {
            if (!estado.boletim) return;

            const valor = parseFloat(document.getElementById('valor-aposta-boletim').value);
            if (isNaN(valor) || valor <= 0) return mostrarNotificacao('Insira um valor de aposta válido.', 'danger');
            if (valor > estado.saldoCarteira) return mostrarNotificacao('Saldo insuficiente para esta transação!', 'danger');

            estado.saldoCarteira -= valor;
            atualizarExibicaoSaldo();

            const novaAposta = {
                id: Date.now(),
                evento: estado.boletim.nomeJogo,
                selecao: estado.boletim.selecao,
                tipo: 'Futebol',
                valorAposta: valor,
                odds: estado.boletim.odds,
                retornoPotencial: valor * estado.boletim.odds,
                status: 'pending'
            };

            estado.minhasApostas.unshift(novaAposta);
            renderizarMinhasApostas();
            
            limparBoletim();
            fecharBoletimCelular();
            mostrarNotificacao(`Aposta de R$ ${valor.toFixed(2)} registrada com sucesso!`, 'success');
            
            setTimeout(() => {
                const aposta = estado.minhasApostas.find(a => a.id === novaAposta.id);
                if (!aposta || aposta.status !== 'pending') return;
                
                if (Math.random() > 0.50) {
                    aposta.status = 'won';
                    estado.saldoCarteira += aposta.retornoPotencial;
                    atualizarExibicaoSaldo();
                    mostrarNotificacao(`Vitória! R$ ${aposta.retornoPotencial.toFixed(2)} creditados.`, 'success');
                } else {
                    aposta.status = 'lost';
                    mostrarNotificacao(`Aposta perdida no futebol.`, 'danger');
                }
                renderizarMinhasApostas();
            }, 8000);
        }

        function renderizarMinhasApostas() {
            const corpoTabela = document.getElementById('tabela-corpo-minhas-apostas');
            if (!corpoTabela) return;
            
            Array.from(corpoTabela.children).forEach(row => {
                if (row.id !== 'linha-tabela-vazia') row.remove();
            });

            if (estado.minhasApostas.length === 0) {
                document.getElementById('linha-tabela-vazia').classList.remove('hidden');
                return;
            }
            
            document.getElementById('linha-tabela-vazia').classList.add('hidden');
            estado.minhasApostas.forEach(aposta => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-marca-borda text-xs text-slate-300';
                
                let distintivo = `<span class="bg-marca-primaria/10 text-marca-primaria border border-marca-primaria/20 px-2 py-1 rounded text-[10px] font-bold uppercase">Pendente</span>`;
                if (aposta.status === 'won') distintivo = `<span class="bg-marca-verdeDestaque/10 text-marca-verdeDestaque border border-marca-verdeDestaque/20 px-2 py-1 rounded text-[10px] font-bold uppercase">Ganhou</span>`;
                else if (aposta.status === 'lost') distintivo = `<span class="bg-marca-primaria/10 text-marca-primaria border border-marca-primaria/20 px-2 py-1 rounded text-[10px] font-bold uppercase">Perdeu</span>`;

                tr.innerHTML = `
                    <td class="p-4"><span class="block font-bold text-slate-200">${aposta.evento}</span><span class="text-[10px] text-slate-400">${aposta.selecao}</span></td>
                    <td class="p-4">${aposta.tipo}</td>
                    <td class="p-4 font-semibold">R$ ${aposta.valorAposta.toFixed(2)}</td>
                    <td class="p-4 font-bold text-marca-primaria">${aposta.odds.toFixed(2)}</td>
                    <td class="p-4 font-black text-marca-verdeDestaque">R$ ${aposta.retornoPotencial.toFixed(2)}</td>
                    <td class="p-4">${distintivo}</td>`;
                corpoTabela.appendChild(tr);
            });
        }

        // --- CASSINO: HISTÓRICOS VISUAIS ---
        function adicionarHistoricoCrash(multiplicador) {
            const container = document.getElementById('historico-resultados-crash');
            if(!container) return;
            const distintivo = document.createElement('span');
            
            const classeCor = multiplicador >= 2.0 
                ? 'bg-marca-verdeDestaque text-black' 
                : 'bg-marca-fundoCard border border-marca-borda text-slate-400';

            distintivo.className = `px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${classeCor}`;
            distintivo.innerText = `${multiplicador.toFixed(2)}x`;

            container.insertBefore(distintivo, container.firstChild);
            if (container.children.length > 10) container.lastChild.remove();
        }

        function adicionarHistoricoRoleta(numero, cor) {
            const container = document.getElementById('historico-resultados-roleta');
            if(!container) return;
            const distintivo = document.createElement('span');
            
            let classeCor = '';
            if (cor === 'vermelho') classeCor = 'bg-marca-primaria text-white';
            else if (cor === 'preto') classeCor = 'bg-slate-800 text-white';
            else if (cor === 'verde') classeCor = 'bg-marca-verdeDestaque text-black';

            distintivo.className = `w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${classeCor}`;
            distintivo.innerText = numero;

            container.insertBefore(distintivo, container.firstChild);
            if (container.children.length > 10) container.lastChild.remove();
        }

        function popularHistoricosIniciais() {
            const arrCrash = [1.2, 4.5, 1.1, 2.3, 1.8];
            arrCrash.forEach(m => adicionarHistoricoCrash(m));

            const arrRoleta = [{n:2,c:'vermelho'}, {n:0,c:'preto'}, {n:5,c:'verde'}, {n:8,c:'vermelho'}];
            arrRoleta.forEach(r => adicionarHistoricoRoleta(r.n, r.c));
        }

        // --- CASSINO: CRASH (FOGUETE) ---
        let elementoCanvasCrash = null;
        let contextoCanvasCrash = null;

        function inicializarCanvasCrash() {
            elementoCanvasCrash = document.getElementById('canvas-crash');
            if (elementoCanvasCrash) {
                contextoCanvasCrash = elementoCanvasCrash.getContext('2d');
            }
        }

        function redimensionarCanvasCrash() {
            if (!elementoCanvasCrash) inicializarCanvasCrash();
            if (elementoCanvasCrash && elementoCanvasCrash.parentElement) {
                elementoCanvasCrash.width = elementoCanvasCrash.parentElement.clientWidth || 500;
                elementoCanvasCrash.height = elementoCanvasCrash.parentElement.clientHeight || 340;
            }
        }

        function desenharEstadoInicialCanvas() {
            if (!contextoCanvasCrash || !elementoCanvasCrash) return;
            contextoCanvasCrash.fillStyle = '#000000';
            contextoCanvasCrash.fillRect(0, 0, elementoCanvasCrash.width, elementoCanvasCrash.height);
            
            contextoCanvasCrash.strokeStyle = 'rgba(220, 38, 38, 0.05)';
            for (let x = 40; x < elementoCanvasCrash.width; x += 40) {
                contextoCanvasCrash.beginPath(); contextoCanvasCrash.moveTo(x, 0); contextoCanvasCrash.lineTo(x, elementoCanvasCrash.height); contextoCanvasCrash.stroke();
            }
            for (let y = 40; y < elementoCanvasCrash.height; y += 40) {
                contextoCanvasCrash.beginPath(); contextoCanvasCrash.moveTo(0, y); contextoCanvasCrash.lineTo(elementoCanvasCrash.width, y); contextoCanvasCrash.stroke();
            }
            contextoCanvasCrash.strokeStyle = 'rgba(220, 38, 38, 0.25)';
            contextoCanvasCrash.beginPath();
            contextoCanvasCrash.moveTo(elementoCanvasCrash.width * 0.08, elementoCanvasCrash.height * 0.9);
            contextoCanvasCrash.lineTo(elementoCanvasCrash.width * 0.95, elementoCanvasCrash.height * 0.9);
            contextoCanvasCrash.moveTo(elementoCanvasCrash.width * 0.08, elementoCanvasCrash.height * 0.1);
            contextoCanvasCrash.lineTo(elementoCanvasCrash.width * 0.08, elementoCanvasCrash.height * 0.9);
            contextoCanvasCrash.stroke();
        }

        function ajustarApostaCrash(modo) {
            const input = document.getElementById('valor-aposta-crash');
            let valor = parseFloat(input.value) || 10;
            if (modo === 'metade') input.value = Math.max(1, Math.round(valor / 2));
            else if (modo === 'dobro') input.value = Math.round(valor * 2);
            else if (modo === 'maximo') input.value = Math.min(estado.saldoCarteira, 1000);
        }

        function dispararJogoCrash() {
            if (estado.crash.estado === 'ocioso') iniciarRodadaCrash();
            else if (estado.crash.estado === 'jogando') executarSaqueCrash();
        }

        function iniciarRodadaCrash() {
            const valor = parseFloat(document.getElementById('valor-aposta-crash').value);
            if (isNaN(valor) || valor <= 0) return mostrarNotificacao('Aposta inválida.', 'danger');
            if (valor > estado.saldoCarteira) return mostrarNotificacao('Saldo insuficiente.', 'danger');

            estado.saldoCarteira -= valor;
            atualizarExibicaoSaldo();

            estado.crash.valorAposta = valor;
            estado.crash.estado = 'jogando';
            estado.crash.multiplicador = 1.00;
            estado.crash.tempoInicio = performance.now();
            estado.crash.particulasRastro = [];
            estado.crash.particulasExplosao = [];
            estado.crash.alvoExplosao = Math.random() < 0.12 ? 1.00 : Math.min(80, 1.01 + (1.3 / (1.001 - Math.random())));

            const playBtn = document.getElementById('botao-jogar-crash');
            playBtn.className = 'w-full bg-marca-verdeDestaque hover:bg-emerald-600 text-slate-950 font-black py-4 rounded-xl transition-all brilho-vermelho text-sm flex flex-col items-center justify-center gap-0.5';
            playBtn.innerHTML = `<span>RESGATAR MULTIPLICADOR</span><span class="text-xs font-semibold uppercase opacity-80" id="visualizador-saque-crash">R$ 0,00</span>`;

            document.getElementById('estado-crash-ocioso').classList.add('hidden');
            document.getElementById('estado-crash-explodiu').classList.add('hidden');
            document.getElementById('estado-crash-jogando').classList.remove('hidden');

            redimensionarCanvasCrash();
            animarCrash();
        }

        function animarCrash() {
            if (estado.crash.estado !== 'jogando') return;

            const decorrido = (performance.now() - estado.crash.tempoInicio) / 1000;
            estado.crash.multiplicador = 1.00 * Math.pow(1.15, decorrido * 2);

            if (estado.crash.multiplicador >= estado.crash.alvoExplosao) return dispararExplosao();

            document.getElementById('exibicao-multiplicador-crash').innerText = `${estado.crash.multiplicador.toFixed(2)}x`;
            document.getElementById('visualizador-saque-crash').innerText = `R$ ${(estado.crash.valorAposta * estado.crash.multiplicador).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            desenharEstadoInicialCanvas(); 
            const w = elementoCanvasCrash.width;
            const h = elementoCanvasCrash.height;
            const progress = Math.min(1.0, (estado.crash.multiplicador - 1) / 12);
            const alvoX = w * 0.08 + (w * 0.82) * progress;
            const alvoY = h * 0.9 - (h * 0.72) * Math.pow(progress, 1.8);

            contextoCanvasCrash.save();
            contextoCanvasCrash.strokeStyle = '#dc2626';
            contextoCanvasCrash.lineWidth = 4;
            contextoCanvasCrash.beginPath();
            contextoCanvasCrash.moveTo(w * 0.08, h * 0.9);
            contextoCanvasCrash.quadraticCurveTo((w * 0.08 + alvoX) / 2, h * 0.9, alvoX, alvoY);
            contextoCanvasCrash.stroke();
            contextoCanvasCrash.restore();

            contextoCanvasCrash.save();
            contextoCanvasCrash.translate(alvoX, alvoY);
            contextoCanvasCrash.fillStyle = '#ffffff';
            contextoCanvasCrash.beginPath();
            contextoCanvasCrash.arc(0, 0, 6, 0, Math.PI * 2);
            contextoCanvasCrash.fill();
            contextoCanvasCrash.restore();

            estado.crash.quadroAnimacao = requestAnimationFrame(animarCrash);
        }

        function executarSaqueCrash() {
            if (estado.crash.estado !== 'jogando') return;
            cancelAnimationFrame(estado.crash.quadroAnimacao);
            estado.crash.estado = 'ocioso';

            const ganho = estado.crash.valorAposta * estado.crash.multiplicador;
            estado.saldoCarteira += ganho;
            atualizarExibicaoSaldo();
            mostrarNotificacao(`Saque garantido! Ganhou R$ ${ganho.toFixed(2)} em ${estado.crash.multiplicador.toFixed(2)}x.`, 'success');
            
            registrarApostaCassino('Jogo do Foguete', estado.crash.valorAposta, estado.crash.multiplicador, ganho, 'won');
            adicionarHistoricoCrash(estado.crash.multiplicador);
            restaurarControlesCrash();
        }

        function dispararExplosao() {
            cancelAnimationFrame(estado.crash.quadroAnimacao);
            estado.crash.estado = 'explodiu';
            
            document.getElementById('estado-crash-jogando').classList.add('hidden');
            document.getElementById('estado-crash-explodiu').classList.remove('hidden');
            document.getElementById('multiplicador-final-crash').innerText = `${estado.crash.alvoExplosao.toFixed(2)}x`;
            mostrarNotificacao(`O foguete explodiu!`, 'danger');

            registrarApostaCassino('Jogo do Foguete', estado.crash.valorAposta, estado.crash.alvoExplosao, 0, 'lost');
            adicionarHistoricoCrash(estado.crash.alvoExplosao);
            setTimeout(restaurarControlesCrash, 3000);
        }

        function restaurarControlesCrash() {
            estado.crash.estado = 'ocioso';
            const playBtn = document.getElementById('botao-jogar-crash');
            playBtn.className = 'w-full bg-marca-primaria hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all brilho-vermelho text-sm flex flex-col items-center justify-center gap-0.5';
            playBtn.innerHTML = `<span>INICIAR JOGO</span>`;

            document.getElementById('estado-crash-jogando').classList.add('hidden');
            document.getElementById('estado-crash-explodiu').classList.add('hidden');
            document.getElementById('estado-crash-ocioso').classList.remove('hidden');
            desenharEstadoInicialCanvas();
        }

        // --- CASSINO: ROLETA ALFA (DOUBLE) ---
        let elementoCanvasRoleta = null;
        let contextoCanvasRoleta = null;

        function inicializarCanvasRoleta() {
            elementoCanvasRoleta = document.getElementById('canvas-roleta');
            if (elementoCanvasRoleta) {
                contextoCanvasRoleta = elementoCanvasRoleta.getContext('2d');
            }
        }

        function redimensionarCanvasRoleta() {
            if (!elementoCanvasRoleta) inicializarCanvasRoleta();
            if (elementoCanvasRoleta && elementoCanvasRoleta.parentElement) {
                elementoCanvasRoleta.width = elementoCanvasRoleta.parentElement.clientWidth || 500;
                elementoCanvasRoleta.height = elementoCanvasRoleta.parentElement.clientHeight || 340;
            }
        }

        function prepararFitaRoleta() {
            const blocos = [];
            // Regra: 0 é Preto (10x). De 1 a 10 alterna: ímpares Verde(2x), pares Vermelho(2x).
            const pegarCor = (num) => {
                if (num === 0) return { cor: '#111111', nome: 'preto' }; 
                if (num % 2 !== 0) return { cor: '#10b981', nome: 'verde' }; 
                return { cor: '#dc2626', nome: 'vermelho' }; 
            };

            for (let i = 0; i < 330; i++) {
                const numero = i % 11; // 0 a 10
                const info = pegarCor(numero);
                blocos.push({ cor: info.cor, nome: info.nome, numero: numero });
            }
            estado.roleta.fita = blocos;
        }

        function selecionarCorApostaRoleta(cor) {
            estado.roleta.corApostada = cor;

            const btnVermelho = document.getElementById('btn-cor-vermelho');
            const btnPreto = document.getElementById('btn-cor-preto');
            const btnVerde = document.getElementById('btn-cor-verde');

            btnVermelho.className = "border-2 border-transparent bg-marca-primaria/40 text-slate-300 font-bold py-2.5 rounded-xl text-xs flex flex-col items-center hover:brightness-110";
            btnPreto.className = "border-2 border-transparent bg-black/40 text-slate-400 font-bold py-2.5 rounded-xl text-xs flex flex-col items-center hover:brightness-110";
            btnVerde.className = "border-2 border-transparent bg-marca-verdeDestaque/40 text-slate-300 font-bold py-2.5 rounded-xl text-xs flex flex-col items-center hover:brightness-110";

            if (cor === 'vermelho') btnVermelho.className = "border-2 border-marca-primaria bg-marca-primaria text-white font-black py-2.5 rounded-xl text-xs flex flex-col items-center";
            else if (cor === 'preto') btnPreto.className = "border-2 border-slate-400 bg-black text-slate-100 font-black py-2.5 rounded-xl text-xs flex flex-col items-center";
            else if (cor === 'verde') btnVerde.className = "border-2 border-emerald-400 bg-marca-verdeDestaque text-black font-black py-2.5 rounded-xl text-xs flex flex-col items-center";
        }

        function desenharEstadoInicialRoleta() {
            if (!contextoCanvasRoleta) return;
            redimensionarCanvasRoleta();
            desenharFitaRoleta();
        }

        function desenharFitaRoleta() {
            if (!contextoCanvasRoleta) return;
            const w = elementoCanvasRoleta.width;
            const h = elementoCanvasRoleta.height;
            const ctx = contextoCanvasRoleta;

            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);
            ctx.strokeStyle = 'rgba(220, 38, 38, 0.03)';
            for (let i = 20; i < w; i += 20) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
            }

            const larguraB = estado.roleta.larguraBloco;
            const alturaB = 90;
            const centerY = h / 2 - alturaB / 2;

            if (estado.roleta.fita.length === 0) prepararFitaRoleta();

            ctx.save();
            const deslocamentoScroll = estado.roleta.scrollAtual;

            estado.roleta.fita.forEach((bloco, indice) => {
                const posX = (indice * larguraB) - deslocamentoScroll + (w / 2 - larguraB / 2);
                if (posX > -larguraB && posX < w + larguraB) {
                    ctx.fillStyle = bloco.cor;
                    ctx.beginPath();
                    ctx.roundRect(posX + 2, centerY, larguraB - 4, alturaB, 12);
                    ctx.fill();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx.stroke();

                    ctx.fillStyle = (bloco.nome === 'verde') ? '#000000' : '#ffffff';
                    ctx.font = '800 20px "Plus Jakarta Sans"';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(bloco.numero, posX + larguraB / 2, h / 2);
                }
            });
            ctx.restore();

            // Seta Central (Mira Vermelha)
            ctx.fillStyle = '#dc2626';
            ctx.beginPath(); ctx.moveTo(w / 2 - 10, centerY - 15); ctx.lineTo(w / 2 + 10, centerY - 15); ctx.lineTo(w / 2, centerY - 2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(w / 2 - 10, centerY + alturaB + 15); ctx.lineTo(w / 2 + 10, centerY + alturaB + 15); ctx.lineTo(w / 2, centerY + alturaB + 2); ctx.fill();
            ctx.strokeStyle = '#dc2626'; ctx.beginPath(); ctx.moveTo(w / 2, centerY - 5); ctx.lineTo(w / 2, centerY + alturaB + 5); ctx.stroke();
        }

        function dispararJogoRoleta() {
            if (estado.roleta.estado === 'girando') return;
            const valor = parseFloat(document.getElementById('valor-aposta-roleta').value);
            if (isNaN(valor) || valor <= 0) return mostrarNotificacao('Aposta inválida.', 'danger');
            if (valor > estado.saldoCarteira) return mostrarNotificacao('Saldo insuficiente!', 'danger');

            estado.saldoCarteira -= valor;
            atualizarExibicaoSaldo();
            estado.roleta.valorAposta = valor;
            estado.roleta.estado = 'girando';

            document.getElementById('botao-girar-roleta').disabled = true;
            document.getElementById('botao-girar-roleta').innerText = "GIRANDO...";
            document.getElementById('texto-estado-roleta').innerText = "A roleta está girando...";

            const sorteioProbabilidade = Math.random();
            let corSorteada = '';
            // Ajustado para refletir a nova matriz
            if (sorteioProbabilidade < (1/11)) corSorteada = 'preto';
            else if (sorteioProbabilidade < (6/11)) corSorteada = 'verde';
            else corSorteada = 'vermelho';

            // Selecionar um bloco dessa cor sorteada
            let indiceAlvo = 88;
            for (let i = 88; i <= 115; i++) {
                if (estado.roleta.fita[i].nome === corSorteada) {
                    indiceAlvo = i;
                    break;
                }
            }

            estado.roleta.resultadoCor = corSorteada;
            estado.roleta.resultadoNumero = estado.roleta.fita[indiceAlvo].numero;
            
            const desvioAleatorio = (Math.random() - 0.5) * (estado.roleta.larguraBloco - 15);
            estado.roleta.alvoScroll = (indiceAlvo * estado.roleta.larguraBloco) + desvioAleatorio;
            estado.roleta.velocidade = 85; 

            animarRoleta();
        }

        function animarRoleta() {
            if (estado.roleta.estado !== 'girando') return;
            estado.roleta.scrollAtual += estado.roleta.velocidade;
            estado.roleta.velocidade *= 0.985; 
            desenharFitaRoleta();

            if (estado.roleta.velocidade < 0.08) return finalizarRodadaRoleta();
            estado.roleta.quadroAnimacao = requestAnimationFrame(animarRoleta);
        }

        function finalizarRodadaRoleta() {
            estado.roleta.estado = 'finalizado';
            document.getElementById('botao-girar-roleta').disabled = false;
            document.getElementById('botao-girar-roleta').innerHTML = `<i class="fa-solid fa-play"></i> Girar Roleta`;

            const venceu = estado.roleta.corApostada === estado.roleta.resultadoCor;
            let multiplicador = (estado.roleta.resultadoCor === 'preto') ? 10 : 2;
            const valorGanho = venceu ? estado.roleta.valorAposta * multiplicador : 0;
            const resultadoNome = estado.roleta.resultadoCor.toUpperCase();

            if (venceu) {
                estado.saldoCarteira += valorGanho;
                atualizarExibicaoSaldo();
                mostrarNotificacao(`Você Venceu! Caiu no ${resultadoNome} ${estado.roleta.resultadoNumero}. Ganhou R$ ${valorGanho.toFixed(2)}!`, 'success');
            } else {
                mostrarNotificacao(`Perdeu. Caiu no ${resultadoNome} ${estado.roleta.resultadoNumero}.`, 'danger');
            }

            document.getElementById('texto-estado-roleta').innerText = `Resultado: ${resultadoNome} ${estado.roleta.resultadoNumero}`;
            
            registrarApostaCassino('Roleta Alfa (Double)', estado.roleta.valorAposta, multiplicador, valorGanho, venceu ? 'won' : 'lost');
            adicionarHistoricoRoleta(estado.roleta.resultadoNumero, estado.roleta.resultadoCor);

            // Reseta a rolagem perfeitamente pelo módulo 880 (11 blocos de 80px)
            setTimeout(() => {
                if (estado.roleta.estado === 'finalizado') {
                    estado.roleta.scrollAtual = estado.roleta.scrollAtual % 880;
                    estado.roleta.estado = 'ocioso';
                    document.getElementById('texto-estado-roleta').innerText = "Faça sua aposta!";
                    desenharFitaRoleta();
                }
            }, 3500);
        }

        function registrarApostaCassino(jogo, aposta, odd, ganho, status) {
            estado.minhasApostas.unshift({
                id: Date.now(),
                evento: `Cassino: ${jogo}`,
                selecao: `Odd / Multiplicador`,
                tipo: 'Cassino',
                valorAposta: aposta,
                odds: odd,
                retornoPotencial: ganho,
                status: status
            });
            renderizarMinhasApostas();
        }

        // --- SISTEMA MOBILE E MENU INFERIOR ---
        function abrirBoletimCelular() {
            document.getElementById('overlay-boletim-celular').classList.remove('hidden');
            const container = document.getElementById('container-boletim-celular');
            if (!estado.boletim) {
                container.innerHTML = `<div class="p-8 text-center text-slate-400">Cupom Vazio</div>`;
                return;
            }
            container.innerHTML = `
                <div class="flex flex-col gap-4">
                    <div class="bg-marca-fundoEscuro border border-marca-borda rounded-xl p-3.5 relative">
                        <span class="text-[9px] uppercase tracking-wider text-marca-primaria font-bold">Aposta Ativa</span>
                        <h4 class="text-xs font-bold text-slate-200 mt-0.5">${estado.boletim.nomeJogo} (${estado.boletim.selecao})</h4>
                    </div>
                    <div>
                        <input type="number" id="valor-aposta-boletim-celular" value="50" oninput="calcularRetornoBoletimCelular()" class="w-full bg-marca-fundoEscuro border border-marca-borda rounded-xl px-4 py-3 text-slate-100 font-bold focus:outline-none focus:border-marca-primaria text-right">
                        <div class="mt-4 pt-4 border-t border-marca-borda flex justify-between">
                            <span class="text-slate-400 text-xs">Retorno:</span>
                            <span id="retorno-boletim-celular-calculado" class="font-bold text-marca-verdeDestaque">R$ 0,00</span>
                        </div>
                        <button onclick="registrarApostaCelular()" class="w-full mt-4 bg-marca-primaria hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all text-xs flex items-center justify-center gap-2">REGISTRAR</button>
                    </div>
                </div>`;
            calcularRetornoBoletimCelular();
        }

        function calcularRetornoBoletimCelular() {
            const input = document.getElementById('valor-aposta-boletim-celular');
            if (!input || !estado.boletim) return;
            const res = (parseFloat(input.value) || 0) * estado.boletim.odds;
            document.getElementById('retorno-boletim-celular-calculado').innerText = `R$ ${res.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }

        function registrarApostaCelular() {
            const val = parseFloat(document.getElementById('valor-aposta-boletim-celular').value);
            if (isNaN(val) || val <= 0) return mostrarNotificacao('Montante de aposta inválido.', 'danger');
            document.getElementById('valor-aposta-boletim').value = val;
            registrarApostaBoletim();
        }

        function fecharBoletimCelular() {
            document.getElementById('overlay-boletim-celular').classList.add('hidden');
        }

        // --- SISTEMA AUTO-EXECUTÁVEL DE ARRANQUE ---
        window.addEventListener('resize', () => {
            if (estado.abaAtiva === 'cassino') {
                redimensionarCanvasCrash();
                desenharEstadoInicialCanvas();
                redimensionarCanvasRoleta();
                desenharEstadoInicialRoleta();
            }
        });

        window.onload = function () {
            inicializarCanvasCrash();
            inicializarCanvasRoleta();
            atualizarExibicaoSaldo();
            renderizarJogosAoVivo();
            renderizarMinhasApostas();
            iniciarOscilacaoDeCotacoes();
        };