import axios from 'axios';


export async function userIsExistAttendance(dni = '', urlImage, callback = () => {  }) {
    if (dni === '') return null;
    try {
        const response = await axios.post(`https://amazona365.ddns.net:3006/api_jarvis/v1/user/attendance/machine/${dni}`, {imageReference: urlImage} )
        callback(null, response);
    }
    catch (error) {

        callback(error?.response);
    }
}



export async function save(dni, body){
    if(!dni) return null;
    try {
        const response = await axios.post(`https://amazona365.ddns.net:3006/api_jarvis/v1/user/attendanc/${dni}`, );
        console.log(response);
    } 
    catch (error) {
        console.log(error)
    }
}