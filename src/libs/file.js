

export const base64ToFile = (base64='') => {
    if(base64 === '') return null;
    const byteCharacters = atob(base64=''); 
    const byteNumbers = new Array(byteCharacters.length); 
    for (let i = 0; i < byteCharacters.length; i++) { 
        byteNumbers[i] = byteCharacters.charCodeAt(i); 
    } 
    const byteArray = new Uint8Array(byteNumbers); // Crear objeto File 
    const file = new File([byteArray], 'foto.jpg', { type: 'image/jpeg' });
    return file;
}
