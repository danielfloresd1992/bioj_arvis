import axios from 'axios';


export async function userIsExist(dni = '', callback=()=>{}) {
    if (dni === '') return null;
    try {
        const response = await axios.get(`https://72.68.60.201/api_jarvis/v1/user/${dni}`)
        callback(null, response);
    }
    catch(error){
        
        callback(error?.response);
    }
}