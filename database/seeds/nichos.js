'use strict';

/**
 * Base extensa de nichos comerciais (centenas de segmentos).
 *
 * Cada nicho declara:
 *  - nome:      rótulo exibido ao usuário
 *  - categoria: agrupamento para organização/filtragem
 *  - termos:    palavras-chave (usadas na busca por nome — fallback)
 *  - osm:       filtros OpenStreetMap [{k, v, regex?}] para a Pesquisa Automática
 *
 * Nichos sem `osm` usam automaticamente a busca por nome sobre as categorias
 * shop/amenity/craft/office/leisure/tourism (ver utils/osmTags.js).
 *
 * Esta base é semeada no banco na primeira execução e fica pesquisável na aba
 * "Nichos". Não depende de cadastro manual.
 */

const t = (k, v, regex) => ({ k, v, regex: !!regex });

const NICHOS = [
  // ---------------- Alimentação e Bebidas ----------------
  { nome: 'Padarias', categoria: 'Alimentação', termos: ['padaria', 'panificadora'], osm: [t('shop', 'bakery')] },
  { nome: 'Confeitarias', categoria: 'Alimentação', termos: ['confeitaria', 'doceria', 'bolos'], osm: [t('shop', 'pastry'), t('shop', 'confectionery')] },
  { nome: 'Açougues', categoria: 'Alimentação', termos: ['acougue', 'carnes'], osm: [t('shop', 'butcher')] },
  { nome: 'Peixarias', categoria: 'Alimentação', termos: ['peixaria', 'pescados'], osm: [t('shop', 'seafood')] },
  { nome: 'Hortifrutis', categoria: 'Alimentação', termos: ['hortifruti', 'sacolao', 'quitanda'], osm: [t('shop', 'greengrocer')] },
  { nome: 'Supermercados', categoria: 'Alimentação', termos: ['supermercado', 'super'], osm: [t('shop', 'supermarket')] },
  { nome: 'Mercados', categoria: 'Alimentação', termos: ['mercado', 'mercearia'], osm: [t('shop', 'convenience'), t('shop', 'general')] },
  { nome: 'Mercearias', categoria: 'Alimentação', termos: ['mercearia', 'mercadinho'], osm: [t('shop', 'convenience')] },
  { nome: 'Empórios', categoria: 'Alimentação', termos: ['emporio', 'delicatessen'], osm: [t('shop', 'deli')] },
  { nome: 'Adegas e Bebidas', categoria: 'Alimentação', termos: ['adega', 'bebidas', 'distribuidora de bebidas'], osm: [t('shop', 'beverages'), t('shop', 'wine')] },
  { nome: 'Casas de Doces', categoria: 'Alimentação', termos: ['doces', 'balas', 'chocolates'], osm: [t('shop', 'confectionery'), t('shop', 'chocolate')] },
  { nome: 'Laticínios', categoria: 'Alimentação', termos: ['laticinios', 'queijos', 'frios'], osm: [t('shop', 'cheese'), t('shop', 'dairy')] },
  { nome: 'Cafeterias', categoria: 'Alimentação', termos: ['cafe', 'cafeteria', 'coffee'], osm: [t('amenity', 'cafe'), t('shop', 'coffee')] },
  { nome: 'Restaurantes', categoria: 'Alimentação', termos: ['restaurante'], osm: [t('amenity', 'restaurant')] },
  { nome: 'Lanchonetes', categoria: 'Alimentação', termos: ['lanchonete', 'lanches', 'fast food'], osm: [t('amenity', 'fast_food')] },
  { nome: 'Pizzarias', categoria: 'Alimentação', termos: ['pizzaria', 'pizza'], osm: [t('amenity', 'restaurant'), t('cuisine', 'pizza')] },
  { nome: 'Hamburguerias', categoria: 'Alimentação', termos: ['hamburgueria', 'burger'], osm: [t('cuisine', 'burger')] },
  { nome: 'Churrascarias', categoria: 'Alimentação', termos: ['churrascaria', 'churrasco'], osm: [t('cuisine', 'barbecue')] },
  { nome: 'Sorveterias', categoria: 'Alimentação', termos: ['sorveteria', 'sorvete', 'gelateria'], osm: [t('amenity', 'ice_cream'), t('shop', 'ice_cream')] },
  { nome: 'Bares', categoria: 'Alimentação', termos: ['bar', 'boteco', 'pub'], osm: [t('amenity', 'bar'), t('amenity', 'pub')] },
  { nome: 'Distribuidoras de Alimentos', categoria: 'Alimentação', termos: ['distribuidora de alimentos', 'atacadao', 'atacado'], osm: [t('shop', 'wholesale')] },
  { nome: 'Casas de Sucos', categoria: 'Alimentação', termos: ['casa de sucos', 'sucos', 'acai'] },
  { nome: 'Marmitarias', categoria: 'Alimentação', termos: ['marmitaria', 'marmitex', 'comida caseira'] },
  { nome: 'Food Trucks', categoria: 'Alimentação', termos: ['food truck'] },
  { nome: 'Casas de Massas', categoria: 'Alimentação', termos: ['massas', 'pastel', 'pastelaria'] },
  { nome: 'Tabacarias', categoria: 'Alimentação', termos: ['tabacaria'], osm: [t('shop', 'tobacco')] },

  // ---------------- Saúde ----------------
  { nome: 'Farmácias', categoria: 'Saúde', termos: ['farmacia', 'drogaria'], osm: [t('amenity', 'pharmacy')] },
  { nome: 'Clínicas', categoria: 'Saúde', termos: ['clinica'], osm: [t('amenity', 'clinic'), t('healthcare', 'clinic')] },
  { nome: 'Consultórios Médicos', categoria: 'Saúde', termos: ['medico', 'consultorio'], osm: [t('amenity', 'doctors'), t('healthcare', 'doctor')] },
  { nome: 'Dentistas', categoria: 'Saúde', termos: ['dentista', 'odontologia'], osm: [t('amenity', 'dentist'), t('healthcare', 'dentist')] },
  { nome: 'Hospitais', categoria: 'Saúde', termos: ['hospital'], osm: [t('amenity', 'hospital')] },
  { nome: 'Laboratórios', categoria: 'Saúde', termos: ['laboratorio', 'analises clinicas'], osm: [t('healthcare', 'laboratory')] },
  { nome: 'Fisioterapeutas', categoria: 'Saúde', termos: ['fisioterapia', 'fisioterapeuta'], osm: [t('healthcare', 'physiotherapist')] },
  { nome: 'Psicólogos', categoria: 'Saúde', termos: ['psicologo', 'psicologia'], osm: [t('healthcare', 'psychotherapist')] },
  { nome: 'Nutricionistas', categoria: 'Saúde', termos: ['nutricionista', 'nutricao'], osm: [t('healthcare', 'nutrition_counselling')] },
  { nome: 'Óticas', categoria: 'Saúde', termos: ['otica', 'oculos'], osm: [t('shop', 'optician')] },
  { nome: 'Clínicas de Estética', categoria: 'Saúde', termos: ['estetica', 'clinica de estetica'], osm: [t('shop', 'beauty')] },
  { nome: 'Fonoaudiólogos', categoria: 'Saúde', termos: ['fonoaudiologo', 'fonoaudiologia'], osm: [t('healthcare', 'speech_therapist')] },
  { nome: 'Terapias Alternativas', categoria: 'Saúde', termos: ['acupuntura', 'terapia', 'quiropraxia'], osm: [t('healthcare', 'alternative')] },
  { nome: 'Produtos Naturais', categoria: 'Saúde', termos: ['produtos naturais', 'suplementos'], osm: [t('shop', 'health_food'), t('shop', 'herbalist')] },
  { nome: 'Ortopedias e Materiais Médicos', categoria: 'Saúde', termos: ['ortopedia', 'materiais medicos'], osm: [t('shop', 'medical_supply')] },
  { nome: 'Podólogos', categoria: 'Saúde', termos: ['podologo', 'podologia'] },

  // ---------------- Beleza e Bem-estar ----------------
  { nome: 'Salões de Beleza', categoria: 'Beleza', termos: ['salao de beleza', 'cabeleireiro'], osm: [t('shop', 'hairdresser')] },
  { nome: 'Barbearias', categoria: 'Beleza', termos: ['barbearia', 'barber'], osm: [t('shop', 'hairdresser'), t('shop', 'barber')] },
  { nome: 'Manicures e Nail Designers', categoria: 'Beleza', termos: ['manicure', 'nail', 'unhas'], osm: [t('shop', 'nails')] },
  { nome: 'Estúdios de Tatuagem', categoria: 'Beleza', termos: ['tatuagem', 'tattoo'], osm: [t('shop', 'tattoo')] },
  { nome: 'Perfumarias e Cosméticos', categoria: 'Beleza', termos: ['perfumaria', 'cosmeticos'], osm: [t('shop', 'cosmetics'), t('shop', 'perfumery')] },
  { nome: 'Casas de Massagem', categoria: 'Beleza', termos: ['massagem', 'massoterapia'], osm: [t('shop', 'massage')] },
  { nome: 'Depilação', categoria: 'Beleza', termos: ['depilacao'] },
  { nome: 'Spas', categoria: 'Beleza', termos: ['spa', 'day spa'], osm: [t('leisure', 'spa')] },

  // ---------------- Automotivo ----------------
  { nome: 'Oficinas Mecânicas', categoria: 'Automotivo', termos: ['oficina', 'mecanica', 'auto center'], osm: [t('shop', 'car_repair')] },
  { nome: 'Auto Elétricas', categoria: 'Automotivo', termos: ['auto eletrica', 'eletrica automotiva'], osm: [t('shop', 'car_repair'), t('service:vehicle:electrical', 'yes')] },
  { nome: 'Autopeças', categoria: 'Automotivo', termos: ['autopecas', 'pecas automotivas'], osm: [t('shop', 'car_parts')] },
  { nome: 'Borracharias', categoria: 'Automotivo', termos: ['borracharia', 'pneus'], osm: [t('shop', 'tyres')] },
  { nome: 'Concessionárias e Lojas de Carros', categoria: 'Automotivo', termos: ['concessionaria', 'revenda de carros', 'veiculos'], osm: [t('shop', 'car')] },
  { nome: 'Lava-Rápidos', categoria: 'Automotivo', termos: ['lava rapido', 'lava jato', 'estetica automotiva'], osm: [t('amenity', 'car_wash')] },
  { nome: 'Lojas de Motos', categoria: 'Automotivo', termos: ['motos', 'motocicletas'], osm: [t('shop', 'motorcycle')] },
  { nome: 'Oficinas de Motos', categoria: 'Automotivo', termos: ['oficina de motos'], osm: [t('shop', 'motorcycle_repair')] },
  { nome: 'Postos de Combustível', categoria: 'Automotivo', termos: ['posto', 'combustivel'], osm: [t('amenity', 'fuel')] },
  { nome: 'Funilaria e Pintura', categoria: 'Automotivo', termos: ['funilaria', 'pintura automotiva'] },
  { nome: 'Insulfilm e Acessórios', categoria: 'Automotivo', termos: ['insulfilm', 'som automotivo', 'acessorios automotivos'] },
  { nome: 'Locadoras de Veículos', categoria: 'Automotivo', termos: ['locadora de veiculos', 'aluguel de carros'], osm: [t('amenity', 'car_rental')] },
  { nome: 'Guinchos e Reboques', categoria: 'Automotivo', termos: ['guincho', 'reboque'] },

  // ---------------- Comércio e Varejo ----------------
  { nome: 'Lojas de Roupas', categoria: 'Varejo', termos: ['roupas', 'confeccoes', 'moda'], osm: [t('shop', 'clothes')] },
  { nome: 'Calçados', categoria: 'Varejo', termos: ['calcados', 'sapatos'], osm: [t('shop', 'shoes')] },
  { nome: 'Boutiques', categoria: 'Varejo', termos: ['boutique'], osm: [t('shop', 'boutique')] },
  { nome: 'Joalherias e Bijuterias', categoria: 'Varejo', termos: ['joalheria', 'joias', 'bijuteria'], osm: [t('shop', 'jewelry')] },
  { nome: 'Relojoarias', categoria: 'Varejo', termos: ['relojoaria', 'relogios'], osm: [t('shop', 'watches')] },
  { nome: 'Lojas de Variedades', categoria: 'Varejo', termos: ['variedades', '1 99', 'utilidades'], osm: [t('shop', 'variety_store')] },
  { nome: 'Papelarias', categoria: 'Varejo', termos: ['papelaria'], osm: [t('shop', 'stationery')] },
  { nome: 'Livrarias', categoria: 'Varejo', termos: ['livraria', 'livros'], osm: [t('shop', 'books')] },
  { nome: 'Brinquedos', categoria: 'Varejo', termos: ['brinquedos', 'loja de brinquedos'], osm: [t('shop', 'toys')] },
  { nome: 'Presentes e Decoração', categoria: 'Varejo', termos: ['presentes', 'decoracao'], osm: [t('shop', 'gift'), t('shop', 'interior_decoration')] },
  { nome: 'Artigos Esportivos', categoria: 'Varejo', termos: ['esportes', 'artigos esportivos'], osm: [t('shop', 'sports')] },
  { nome: 'Bicicletarias', categoria: 'Varejo', termos: ['bicicletaria', 'bikes'], osm: [t('shop', 'bicycle')] },
  { nome: 'Óticas e Relojoarias', categoria: 'Varejo', termos: ['otica relojoaria'], osm: [t('shop', 'optician')] },
  { nome: 'Floriculturas', categoria: 'Varejo', termos: ['floricultura', 'flores'], osm: [t('shop', 'florist')] },
  { nome: 'Pet Shops', categoria: 'Varejo', termos: ['pet shop', 'petshop'], osm: [t('shop', 'pet')] },
  { nome: 'Agropecuárias', categoria: 'Varejo', termos: ['agropecuaria', 'agro', 'racoes'], osm: [t('shop', 'agrarian'), t('shop', 'farm')] },
  { nome: 'Lojas de Cosméticos', categoria: 'Varejo', termos: ['cosmeticos', 'maquiagem'], osm: [t('shop', 'cosmetics')] },
  { nome: 'Lojas de Departamento', categoria: 'Varejo', termos: ['loja de departamento'], osm: [t('shop', 'department_store')] },
  { nome: 'Shopping e Galerias', categoria: 'Varejo', termos: ['shopping', 'galeria'], osm: [t('shop', 'mall')] },
  { nome: 'Armarinhos e Aviamentos', categoria: 'Varejo', termos: ['armarinho', 'aviamentos', 'tecidos'], osm: [t('shop', 'fabric'), t('shop', 'sewing')] },
  { nome: 'Brechós', categoria: 'Varejo', termos: ['brecho', 'usados'], osm: [t('shop', 'second_hand')] },
  { nome: 'Lojas de Bolsas e Acessórios', categoria: 'Varejo', termos: ['bolsas', 'acessorios'], osm: [t('shop', 'bag'), t('shop', 'fashion_accessories')] },
  { nome: 'Óculos e Acessórios', categoria: 'Varejo', termos: ['oculos de sol'] },
  { nome: 'Lojas de Festas e Embalagens', categoria: 'Varejo', termos: ['festas', 'embalagens', 'descartaveis'] },
  { nome: 'Tabacaria e Conveniência', categoria: 'Varejo', termos: ['conveniencia'] },

  // ---------------- Casa e Construção ----------------
  { nome: 'Materiais de Construção', categoria: 'Construção', termos: ['material de construcao', 'construcao'], osm: [t('shop', 'doityourself'), t('shop', 'hardware'), t('shop', 'trade')] },
  { nome: 'Ferragens', categoria: 'Construção', termos: ['ferragem', 'ferramentas'], osm: [t('shop', 'hardware')] },
  { nome: 'Lojas de Tintas', categoria: 'Construção', termos: ['tintas'], osm: [t('shop', 'paint')] },
  { nome: 'Elétrica e Iluminação', categoria: 'Construção', termos: ['material eletrico', 'iluminacao'], osm: [t('shop', 'electrical'), t('shop', 'lighting')] },
  { nome: 'Vidraçarias', categoria: 'Construção', termos: ['vidracaria', 'vidros'], osm: [t('shop', 'glaziery'), t('craft', 'glaziery')] },
  { nome: 'Marmorarias', categoria: 'Construção', termos: ['marmoraria', 'granito', 'marmore'], osm: [t('craft', 'stonemason')] },
  { nome: 'Serralherias', categoria: 'Construção', termos: ['serralheria', 'esquadrias'], osm: [t('craft', 'metal_construction')] },
  { nome: 'Marcenarias', categoria: 'Construção', termos: ['marcenaria', 'moveis planejados'], osm: [t('craft', 'carpenter')] },
  { nome: 'Lojas de Móveis', categoria: 'Construção', termos: ['moveis', 'moveis planejados'], osm: [t('shop', 'furniture')] },
  { nome: 'Colchões', categoria: 'Construção', termos: ['colchoes', 'colchao'], osm: [t('shop', 'bed')] },
  { nome: 'Cozinhas e Utensílios', categoria: 'Construção', termos: ['utilidades domesticas', 'cozinha'], osm: [t('shop', 'kitchen'), t('shop', 'houseware')] },
  { nome: 'Cortinas e Persianas', categoria: 'Construção', termos: ['cortinas', 'persianas'], osm: [t('shop', 'curtain')] },
  { nome: 'Tapetes e Carpetes', categoria: 'Construção', termos: ['tapetes', 'carpetes'], osm: [t('shop', 'carpet')] },
  { nome: 'Vidraçaria e Esquadrias de Alumínio', categoria: 'Construção', termos: ['esquadrias de aluminio'], osm: [t('craft', 'window_construction')] },
  { nome: 'Jardinagem e Paisagismo', categoria: 'Construção', termos: ['jardinagem', 'paisagismo', 'garden'], osm: [t('shop', 'garden_centre')] },
  { nome: 'Piscinas', categoria: 'Construção', termos: ['piscinas', 'material para piscina'] },
  { nome: 'Ar-Condicionado e Refrigeração', categoria: 'Construção', termos: ['ar condicionado', 'refrigeracao', 'climatizacao'], osm: [t('craft', 'hvac')] },
  { nome: 'Molduras e Quadros', categoria: 'Construção', termos: ['molduras', 'quadros'], osm: [t('shop', 'frame')] },
  { nome: 'Loja de Pisos e Revestimentos', categoria: 'Construção', termos: ['pisos', 'revestimentos', 'ceramica'] },

  // ---------------- Serviços Profissionais ----------------
  { nome: 'Advogados', categoria: 'Serviços', termos: ['advogado', 'advocacia', 'escritorio de advocacia'], osm: [t('office', 'lawyer')] },
  { nome: 'Contabilidades', categoria: 'Serviços', termos: ['contabilidade', 'contador', 'escritorio contabil'], osm: [t('office', 'accountant')] },
  { nome: 'Arquitetos', categoria: 'Serviços', termos: ['arquiteto', 'arquitetura'], osm: [t('office', 'architect')] },
  { nome: 'Engenharias', categoria: 'Serviços', termos: ['engenharia', 'engenheiro'], osm: [t('office', 'engineer'), t('office', 'engineering')] },
  { nome: 'Corretoras de Seguros', categoria: 'Serviços', termos: ['seguros', 'corretora de seguros'], osm: [t('office', 'insurance')] },
  { nome: 'Imobiliárias', categoria: 'Serviços', termos: ['imobiliaria', 'imoveis'], osm: [t('office', 'estate_agent'), t('shop', 'estate_agent')] },
  { nome: 'Despachantes', categoria: 'Serviços', termos: ['despachante'] },
  { nome: 'Cartórios', categoria: 'Serviços', termos: ['cartorio', 'tabeliao'], osm: [t('office', 'notary')] },
  { nome: 'Agências de Publicidade', categoria: 'Serviços', termos: ['publicidade', 'marketing', 'agencia de marketing'], osm: [t('office', 'advertising_agency')] },
  { nome: 'Agências de Viagens', categoria: 'Serviços', termos: ['agencia de viagens', 'turismo'], osm: [t('shop', 'travel_agency')] },
  { nome: 'Empresas de TI', categoria: 'Serviços', termos: ['tecnologia', 'software', 'ti', 'desenvolvimento'], osm: [t('office', 'it')] },
  { nome: 'Consultorias', categoria: 'Serviços', termos: ['consultoria'], osm: [t('office', 'consulting')] },
  { nome: 'Agências de Emprego e RH', categoria: 'Serviços', termos: ['agencia de emprego', 'recursos humanos', 'rh'], osm: [t('office', 'employment_agency')] },
  { nome: 'Transportadoras e Logística', categoria: 'Serviços', termos: ['transportadora', 'logistica', 'fretes'], osm: [t('office', 'logistics')] },
  { nome: 'Gráficas', categoria: 'Serviços', termos: ['grafica', 'impressao'], osm: [t('shop', 'copyshop'), t('craft', 'printer')] },
  { nome: 'Comunicação Visual', categoria: 'Serviços', termos: ['comunicacao visual', 'letreiros', 'adesivos'], osm: [t('craft', 'sign_maker')] },
  { nome: 'Chaveiros', categoria: 'Serviços', termos: ['chaveiro'], osm: [t('shop', 'locksmith'), t('craft', 'key_cutter')] },
  { nome: 'Lavanderias', categoria: 'Serviços', termos: ['lavanderia'], osm: [t('shop', 'laundry'), t('shop', 'dry_cleaning')] },
  { nome: 'Funerárias', categoria: 'Serviços', termos: ['funeraria'], osm: [t('shop', 'funeral_directors')] },
  { nome: 'Dedetizadoras', categoria: 'Serviços', termos: ['dedetizacao', 'controle de pragas'] },
  { nome: 'Empresas de Limpeza', categoria: 'Serviços', termos: ['limpeza', 'servicos de limpeza', 'diarista'] },
  { nome: 'Segurança e Monitoramento', categoria: 'Serviços', termos: ['seguranca', 'monitoramento', 'cameras', 'cftv'] },
  { nome: 'Assistência Técnica', categoria: 'Serviços', termos: ['assistencia tecnica', 'conserto'], osm: [t('craft', 'electronics_repair')] },
  { nome: 'Fotógrafos e Estúdios', categoria: 'Serviços', termos: ['fotografo', 'estudio fotografico', 'fotografia'], osm: [t('craft', 'photographer'), t('shop', 'photo')] },
  { nome: 'Serviços de Costura', categoria: 'Serviços', termos: ['costura', 'ajustes', 'alfaiataria'], osm: [t('craft', 'tailor'), t('shop', 'tailor')] },
  { nome: 'Sapateiros', categoria: 'Serviços', termos: ['sapateiro', 'conserto de calcados'], osm: [t('craft', 'shoemaker')] },
  { nome: 'Financeiras e Correspondentes', categoria: 'Serviços', termos: ['financeira', 'emprestimos', 'credito'], osm: [t('office', 'financial')] },
  { nome: 'Cabeamento e Redes', categoria: 'Serviços', termos: ['redes', 'cabeamento', 'provedor de internet'] },

  // ---------------- Profissionais e Reformas ----------------
  { nome: 'Eletricistas', categoria: 'Reformas', termos: ['eletricista'], osm: [t('craft', 'electrician')] },
  { nome: 'Encanadores', categoria: 'Reformas', termos: ['encanador', 'hidraulica'], osm: [t('craft', 'plumber')] },
  { nome: 'Pintores', categoria: 'Reformas', termos: ['pintor', 'pintura predial'], osm: [t('craft', 'painter')] },
  { nome: 'Pedreiros e Construção Civil', categoria: 'Reformas', termos: ['pedreiro', 'construcao civil'], osm: [t('craft', 'builder')] },
  { nome: 'Gesseiros e Drywall', categoria: 'Reformas', termos: ['gesso', 'drywall', 'gesseiro'], osm: [t('craft', 'plasterer')] },
  { nome: 'Estofadores e Tapeçarias', categoria: 'Reformas', termos: ['estofados', 'tapecaria', 'reforma de estofados'], osm: [t('craft', 'upholsterer')] },
  { nome: 'Jardineiros', categoria: 'Reformas', termos: ['jardineiro'], osm: [t('craft', 'gardener')] },
  { nome: 'Soldadores', categoria: 'Reformas', termos: ['solda', 'soldador'], osm: [t('craft', 'welder')] },

  // ---------------- Educação ----------------
  { nome: 'Escolas', categoria: 'Educação', termos: ['escola', 'colegio'], osm: [t('amenity', 'school')] },
  { nome: 'Creches e Educação Infantil', categoria: 'Educação', termos: ['creche', 'berçario', 'educacao infantil'], osm: [t('amenity', 'kindergarten')] },
  { nome: 'Faculdades e Universidades', categoria: 'Educação', termos: ['faculdade', 'universidade'], osm: [t('amenity', 'college'), t('amenity', 'university')] },
  { nome: 'Cursos de Idiomas', categoria: 'Educação', termos: ['idiomas', 'ingles', 'escola de idiomas'], osm: [t('amenity', 'language_school')] },
  { nome: 'Autoescolas', categoria: 'Educação', termos: ['autoescola', 'cfc'], osm: [t('amenity', 'driving_school')] },
  { nome: 'Escolas de Música', categoria: 'Educação', termos: ['escola de musica', 'aulas de musica'], osm: [t('amenity', 'music_school')] },
  { nome: 'Cursos Profissionalizantes', categoria: 'Educação', termos: ['curso profissionalizante', 'curso tecnico'] },
  { nome: 'Reforço Escolar', categoria: 'Educação', termos: ['reforco escolar', 'aulas particulares'] },
  { nome: 'Escolas de Dança', categoria: 'Educação', termos: ['escola de danca', 'danca'], osm: [t('leisure', 'dance')] },

  // ---------------- Esporte e Lazer ----------------
  { nome: 'Academias', categoria: 'Esporte', termos: ['academia', 'musculacao', 'fitness'], osm: [t('leisure', 'fitness_centre')] },
  { nome: 'Estúdios de Pilates', categoria: 'Esporte', termos: ['pilates'] },
  { nome: 'Crossfit e Funcional', categoria: 'Esporte', termos: ['crossfit', 'treinamento funcional'] },
  { nome: 'Escolas de Natação', categoria: 'Esporte', termos: ['natacao', 'escola de natacao'], osm: [t('leisure', 'swimming_pool')] },
  { nome: 'Quadras e Campos', categoria: 'Esporte', termos: ['quadra', 'campo de futebol', 'society'], osm: [t('leisure', 'pitch')] },
  { nome: 'Artes Marciais', categoria: 'Esporte', termos: ['jiu jitsu', 'karate', 'muay thai', 'academia de luta'] },
  { nome: 'Clubes e Associações', categoria: 'Esporte', termos: ['clube', 'associacao'], osm: [t('leisure', 'sports_centre')] },
  { nome: 'Cinemas', categoria: 'Lazer', termos: ['cinema'], osm: [t('amenity', 'cinema')] },
  { nome: 'Teatros e Casas de Show', categoria: 'Lazer', termos: ['teatro', 'casa de show'], osm: [t('amenity', 'theatre')] },
  { nome: 'Boliches e Diversões', categoria: 'Lazer', termos: ['boliche', 'diversoes'], osm: [t('leisure', 'bowling_alley')] },
  { nome: 'Buffets e Salões de Festa', categoria: 'Lazer', termos: ['buffet', 'salao de festa', 'espaco de eventos'] },

  // ---------------- Hospedagem e Turismo ----------------
  { nome: 'Hotéis', categoria: 'Turismo', termos: ['hotel'], osm: [t('tourism', 'hotel')] },
  { nome: 'Pousadas', categoria: 'Turismo', termos: ['pousada'], osm: [t('tourism', 'guest_house')] },
  { nome: 'Motéis', categoria: 'Turismo', termos: ['motel'], osm: [t('tourism', 'motel')] },
  { nome: 'Hostels', categoria: 'Turismo', termos: ['hostel', 'albergue'], osm: [t('tourism', 'hostel')] },
  { nome: 'Chácaras e Espaços para Eventos', categoria: 'Turismo', termos: ['chacara', 'sitio', 'espaco para eventos'] },
  { nome: 'Museus e Galerias', categoria: 'Turismo', termos: ['museu', 'galeria de arte'], osm: [t('tourism', 'museum'), t('tourism', 'gallery')] },

  // ---------------- Eletrônicos e Tecnologia ----------------
  { nome: 'Lojas de Celulares e Telefonia', categoria: 'Tecnologia', termos: ['celular', 'telefonia', 'acessorios celular'], osm: [t('shop', 'mobile_phone')] },
  { nome: 'Informática', categoria: 'Tecnologia', termos: ['informatica', 'computadores'], osm: [t('shop', 'computer')] },
  { nome: 'Eletrônicos', categoria: 'Tecnologia', termos: ['eletronicos'], osm: [t('shop', 'electronics')] },
  { nome: 'Eletrodomésticos', categoria: 'Tecnologia', termos: ['eletrodomesticos'], osm: [t('shop', 'appliance')] },
  { nome: 'Games e Video Games', categoria: 'Tecnologia', termos: ['games', 'video game'], osm: [t('shop', 'video_games')] },
  { nome: 'Assistência de Celulares', categoria: 'Tecnologia', termos: ['assistencia de celular', 'conserto de celular'] },
  { nome: 'Provedores de Internet', categoria: 'Tecnologia', termos: ['provedor', 'internet', 'fibra'], osm: [t('office', 'telecommunication')] },

  // ---------------- Instrumentos e Cultura ----------------
  { nome: 'Lojas de Instrumentos Musicais', categoria: 'Cultura', termos: ['instrumentos musicais', 'musica'], osm: [t('shop', 'musical_instrument')] },
  { nome: 'Lojas de Discos e Mídias', categoria: 'Cultura', termos: ['discos', 'vinil', 'cds'], osm: [t('shop', 'music')] },
  { nome: 'Artes e Materiais Artísticos', categoria: 'Cultura', termos: ['materiais de arte', 'artesanato'], osm: [t('shop', 'art'), t('shop', 'craft')] },

  // ---------------- Financeiro e Institucional ----------------
  { nome: 'Bancos', categoria: 'Financeiro', termos: ['banco', 'agencia bancaria'], osm: [t('amenity', 'bank')] },
  { nome: 'Casas Lotéricas', categoria: 'Financeiro', termos: ['loterica', 'loteria'], osm: [t('shop', 'lottery')] },
  { nome: 'Correios e Agências Postais', categoria: 'Institucional', termos: ['correios', 'agencia postal'], osm: [t('amenity', 'post_office')] },

  // ---------------- Agro e Indústria ----------------
  { nome: 'Cooperativas Agrícolas', categoria: 'Agro', termos: ['cooperativa', 'agricola'] },
  { nome: 'Máquinas e Implementos Agrícolas', categoria: 'Agro', termos: ['maquinas agricolas', 'implementos', 'tratores'] },
  { nome: 'Indústrias e Fábricas', categoria: 'Indústria', termos: ['industria', 'fabrica', 'metalurgica'] },
  { nome: 'Distribuidoras e Atacados', categoria: 'Indústria', termos: ['distribuidora', 'atacado', 'atacadista'], osm: [t('shop', 'wholesale')] },
  { nome: 'Embalagens Industriais', categoria: 'Indústria', termos: ['embalagens', 'plasticos', 'embalagem industrial'] },

  // ---------------- Diversos ----------------
  { nome: 'Clínicas Veterinárias', categoria: 'Pet', termos: ['veterinaria', 'veterinario', 'clinica veterinaria'], osm: [t('amenity', 'veterinary')] },
  { nome: 'Banho e Tosa', categoria: 'Pet', termos: ['banho e tosa', 'estetica animal'] },
  { nome: 'Igrejas e Templos', categoria: 'Comunidade', termos: ['igreja', 'templo'], osm: [t('amenity', 'place_of_worship')] },
  { nome: 'ONGs e Associações', categoria: 'Comunidade', termos: ['ong', 'associacao', 'instituto'], osm: [t('office', 'ngo'), t('office', 'association')] },
  { nome: 'Coworkings', categoria: 'Negócios', termos: ['coworking', 'escritorio compartilhado'], osm: [t('office', 'coworking')] },
];

// Segundo lote — amplia a base para centenas de segmentos.
const NICHOS_EXTRA = [
  // Alimentação
  { nome: 'Cervejarias e Choperias', categoria: 'Alimentação', termos: ['cervejaria', 'choperia', 'chopp'], osm: [t('craft', 'brewery'), t('shop', 'alcohol')] },
  { nome: 'Vinícolas e Vinhos', categoria: 'Alimentação', termos: ['vinicola', 'vinhos'], osm: [t('craft', 'winery'), t('shop', 'wine')] },
  { nome: 'Comida Japonesa e Sushi', categoria: 'Alimentação', termos: ['sushi', 'japonesa', 'temaki'], osm: [t('cuisine', 'japanese', true)] },
  { nome: 'Comida Chinesa', categoria: 'Alimentação', termos: ['comida chinesa', 'yakisoba'], osm: [t('cuisine', 'chinese')] },
  { nome: 'Pastelarias', categoria: 'Alimentação', termos: ['pastelaria', 'pastel'] },
  { nome: 'Esfiharias', categoria: 'Alimentação', termos: ['esfiharia', 'esfiha', 'comida arabe'] },
  { nome: 'Casas de Bolo', categoria: 'Alimentação', termos: ['casa de bolo', 'bolos caseiros'] },
  { nome: 'Açaí e Sorvetes', categoria: 'Alimentação', termos: ['acai', 'acaiteria'] },
  { nome: 'Rotisserias', categoria: 'Alimentação', termos: ['rotisseria', 'comida pronta'] },
  { nome: 'Casas de Temperos', categoria: 'Alimentação', termos: ['temperos', 'condimentos', 'especiarias'] },
  { nome: 'Docerias', categoria: 'Alimentação', termos: ['doceria', 'brigadeiro', 'bem casado'] },

  // Saúde (especialidades — busca por nome)
  { nome: 'Oftalmologistas', categoria: 'Saúde', termos: ['oftalmologista', 'oftalmologia'] },
  { nome: 'Dermatologistas', categoria: 'Saúde', termos: ['dermatologista', 'dermatologia'] },
  { nome: 'Pediatras', categoria: 'Saúde', termos: ['pediatra', 'pediatria'] },
  { nome: 'Ginecologistas', categoria: 'Saúde', termos: ['ginecologista', 'ginecologia'] },
  { nome: 'Cardiologistas', categoria: 'Saúde', termos: ['cardiologista', 'cardiologia'] },
  { nome: 'Ortodontia', categoria: 'Saúde', termos: ['ortodontia', 'aparelho dental'] },
  { nome: 'Clínicas de Vacinação', categoria: 'Saúde', termos: ['vacinas', 'imunizacao', 'clinica de vacinas'] },
  { nome: 'Home Care e Cuidadores', categoria: 'Saúde', termos: ['home care', 'cuidador de idosos', 'enfermagem'] },
  { nome: 'Planos de Saúde', categoria: 'Saúde', termos: ['plano de saude', 'convenio medico'] },
  { nome: 'Óticas e Optometria', categoria: 'Saúde', termos: ['optometria'], osm: [t('shop', 'optician')] },

  // Beleza
  { nome: 'Design de Sobrancelhas', categoria: 'Beleza', termos: ['sobrancelhas', 'design de sobrancelha'] },
  { nome: 'Micropigmentação', categoria: 'Beleza', termos: ['micropigmentacao', 'dermopigmentacao'] },
  { nome: 'Bronzeamento', categoria: 'Beleza', termos: ['bronzeamento', 'bronze artificial'] },
  { nome: 'Clínicas de Emagrecimento', categoria: 'Beleza', termos: ['emagrecimento', 'estetica corporal'] },

  // Automotivo
  { nome: 'Vidros Automotivos', categoria: 'Automotivo', termos: ['vidros automotivos', 'parabrisa'] },
  { nome: 'Rastreamento Veicular', categoria: 'Automotivo', termos: ['rastreamento veicular', 'rastreador'] },
  { nome: 'Baterias Automotivas', categoria: 'Automotivo', termos: ['baterias', 'baterias automotivas'] },
  { nome: 'Escapamentos', categoria: 'Automotivo', termos: ['escapamentos', 'escapamento'] },
  { nome: 'Martelinho de Ouro', categoria: 'Automotivo', termos: ['martelinho de ouro', 'reparo de funilaria'] },
  { nome: 'Blindagem de Veículos', categoria: 'Automotivo', termos: ['blindagem', 'blindagem automotiva'] },
  { nome: 'Estacionamentos', categoria: 'Automotivo', termos: ['estacionamento'], osm: [t('amenity', 'parking'), t('amenity', 'parking_entrance')] },

  // Varejo
  { nome: 'Lojas de Bebês e Enxoval', categoria: 'Varejo', termos: ['bebe', 'enxoval', 'moda infantil'], osm: [t('shop', 'baby_goods')] },
  { nome: 'Moda Íntima e Lingerie', categoria: 'Varejo', termos: ['lingerie', 'moda intima'] },
  { nome: 'Moda Praia', categoria: 'Varejo', termos: ['moda praia', 'biquini'] },
  { nome: 'Moda Fitness', categoria: 'Varejo', termos: ['moda fitness', 'roupa de academia'] },
  { nome: 'Lojas de Pesca e Camping', categoria: 'Varejo', termos: ['pesca', 'camping'], osm: [t('shop', 'fishing'), t('shop', 'outdoor')] },
  { nome: 'Lojas de Importados', categoria: 'Varejo', termos: ['importados', 'produtos importados'] },
  { nome: 'Lojas de Vinhos e Adegas', categoria: 'Varejo', termos: ['loja de vinhos'], osm: [t('shop', 'wine')] },
  { nome: 'Lojas de Suplementos', categoria: 'Varejo', termos: ['suplementos', 'whey', 'nutricao esportiva'] },
  { nome: 'Lojas de Semijoias', categoria: 'Varejo', termos: ['semijoias', 'folheados'] },
  { nome: 'Óticas e Relógios', categoria: 'Varejo', termos: ['relogios'], osm: [t('shop', 'watches')] },

  // Construção e Reformas
  { nome: 'Madeireiras', categoria: 'Construção', termos: ['madeireira', 'madeiras'], osm: [t('shop', 'trade')] },
  { nome: 'Depósitos de Materiais', categoria: 'Construção', termos: ['deposito de materiais', 'deposito de construcao'] },
  { nome: 'Telhas e Coberturas', categoria: 'Construção', termos: ['telhas', 'coberturas', 'telhados'], osm: [t('craft', 'roofer')] },
  { nome: 'Energia Solar (Fotovoltaica)', categoria: 'Construção', termos: ['energia solar', 'fotovoltaica', 'placas solares'] },
  { nome: 'Automação e Portões Eletrônicos', categoria: 'Construção', termos: ['portao eletronico', 'automatizadores', 'automacao'] },
  { nome: 'Cercas e Alambrados', categoria: 'Construção', termos: ['cercas', 'alambrado', 'cerca eletrica'] },
  { nome: 'Impermeabilização', categoria: 'Construção', termos: ['impermeabilizacao'] },
  { nome: 'Locação de Equipamentos e Andaimes', categoria: 'Construção', termos: ['locacao de equipamentos', 'andaimes', 'betoneira'] },
  { nome: 'Terraplenagem', categoria: 'Construção', termos: ['terraplenagem', 'terraplanagem'] },
  { nome: 'Poços Artesianos', categoria: 'Construção', termos: ['poco artesiano', 'perfuracao de pocos'] },
  { nome: 'Persianas e Toldos', categoria: 'Construção', termos: ['toldos', 'persianas', 'coberturas retrateis'] },

  // Serviços
  { nome: 'Casas de Câmbio', categoria: 'Serviços', termos: ['cambio', 'casa de cambio'], osm: [t('amenity', 'bureau_de_change')] },
  { nome: 'Correspondentes Bancários', categoria: 'Serviços', termos: ['correspondente bancario'] },
  { nome: 'Escritórios de Cobrança', categoria: 'Serviços', termos: ['cobranca', 'assessoria de cobranca'] },
  { nome: 'Tradução e Tradutores', categoria: 'Serviços', termos: ['traducao', 'tradutor juramentado'] },
  { nome: 'Cerimonial e Eventos', categoria: 'Serviços', termos: ['cerimonial', 'organizacao de eventos', 'assessoria de eventos'] },
  { nome: 'Decoração de Festas', categoria: 'Serviços', termos: ['decoracao de festas', 'festa'] },
  { nome: 'Aluguel de Trajes', categoria: 'Serviços', termos: ['aluguel de trajes', 'locacao de roupas', 'ternos'] },
  { nome: 'DJ e Sonorização', categoria: 'Serviços', termos: ['dj', 'sonorizacao', 'som para eventos'] },
  { nome: 'Filmagem e Produção', categoria: 'Serviços', termos: ['filmagem', 'produtora de video', 'audiovisual'] },
  { nome: 'Buffet Infantil', categoria: 'Serviços', termos: ['buffet infantil', 'festa infantil'] },
  { nome: 'Serigrafia e Estamparia', categoria: 'Serviços', termos: ['serigrafia', 'estamparia', 'silk'] },
  { nome: 'Chaveiro e Fechaduras', categoria: 'Serviços', termos: ['fechaduras', 'chaveiro auto'] },

  // Educação
  { nome: 'Escolas de Informática', categoria: 'Educação', termos: ['escola de informatica', 'curso de informatica'] },
  { nome: 'Cursinhos Pré-Vestibular', categoria: 'Educação', termos: ['pre vestibular', 'cursinho'] },
  { nome: 'Escolas Bilíngues', categoria: 'Educação', termos: ['escola bilingue'] },

  // Tecnologia e Marketing
  { nome: 'Agências de Marketing Digital', categoria: 'Tecnologia', termos: ['marketing digital', 'agencia digital', 'trafego pago'] },
  { nome: 'Desenvolvimento de Sites', categoria: 'Tecnologia', termos: ['criacao de sites', 'desenvolvimento web'] },
  { nome: 'Segurança Eletrônica e CFTV', categoria: 'Tecnologia', termos: ['cftv', 'cameras de seguranca', 'alarmes'] },

  // Pet
  { nome: 'Adestramento de Cães', categoria: 'Pet', termos: ['adestramento', 'adestrador'] },
  { nome: 'Hotéis para Pets', categoria: 'Pet', termos: ['hotel para caes', 'creche para pets'] },
  { nome: 'Aquarismo', categoria: 'Pet', termos: ['aquarismo', 'aquario', 'peixes ornamentais'] },

  // Indústria e Agro
  { nome: 'Ferro-Velho e Sucata', categoria: 'Indústria', termos: ['ferro velho', 'sucata', 'reciclagem de metais'], osm: [t('shop', 'scrap_yard')] },
  { nome: 'Recicladoras', categoria: 'Indústria', termos: ['reciclagem', 'recicladora', 'cooperativa de reciclagem'] },
  { nome: 'Usinagem e Caldeiraria', categoria: 'Indústria', termos: ['usinagem', 'caldeiraria', 'tornearia'] },
  { nome: 'Fábricas de Móveis', categoria: 'Indústria', termos: ['fabrica de moveis', 'moveleira'] },
  { nome: 'Cerâmicas e Olarias', categoria: 'Indústria', termos: ['ceramica', 'olaria', 'tijolos'] },
  { nome: 'Confecções e Facções', categoria: 'Indústria', termos: ['confeccao', 'faccao', 'costura industrial'] },
];

module.exports = NICHOS.concat(NICHOS_EXTRA);
