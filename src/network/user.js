import axios from 'axios';


export async function userIsExist(dni = '', callback = () => { }) {
    if (dni === '') return null;
    try {
        const response = await axios.get(`https://amazona365.ddns.net:3006/api_jarvis/v1/user/${dni}`)
        callback(null, response);
    }
    catch (error) {

        callback(error?.response);
    }
}