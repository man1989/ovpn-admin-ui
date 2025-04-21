export function isAuthenticated() {
  return !!localStorage.getItem('token');
}

export function getToken(){
  return localStorage.getItem('token');
}

export function logout() {
  localStorage.removeItem('token');
}