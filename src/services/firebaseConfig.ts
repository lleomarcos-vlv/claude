/**
 * Configuração do Firebase (sincronização em tempo real entre os aparelhos).
 *
 * Enquanto os valores abaixo forem os de exemplo, o app roda em
 * "modo demonstração": os dados ficam salvos apenas no aparelho.
 *
 * Para ativar a sincronização real (cliente agenda no celular dele e o
 * horário aparece na hora no celular do barbeiro):
 *   1. Crie um projeto grátis em https://console.firebase.google.com
 *   2. Adicione um app Web ao projeto e copie o objeto firebaseConfig
 *   3. Cole os valores aqui e gere o APK novamente
 *   4. No console, ative o Cloud Firestore (modo de produção) e publique
 *      as regras sugeridas no README.md
 */
export const firebaseConfig = {
  apiKey: 'COLE_AQUI_SUA_API_KEY',
  authDomain: 'seu-projeto.firebaseapp.com',
  projectId: 'seu-projeto',
  storageBucket: 'seu-projeto.appspot.com',
  messagingSenderId: '000000000000',
  appId: 'COLE_AQUI_SEU_APP_ID',
};

export function isFirebaseConfigured(): boolean {
  return !firebaseConfig.apiKey.startsWith('COLE_AQUI');
}
