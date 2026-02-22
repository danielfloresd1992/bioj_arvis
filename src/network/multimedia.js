import axios from 'axios';


export async function sendImage(file){
    try {
        if(!file) {
            alert('File undefined')
            throw 'File undefined';
        }
        
        const formData = new FormData();
        formData.append('img', file);

        const result = await axios.post('https://amazona365.ddns.net:3006/api_jarvis/v1/multimedia', formData);
        return result.data
    } 
    catch (error) {
        console.log(error);
        throw error;    
    }
}