import axios from 'axios';
const URL = import.meta.env.VITE_API_URL;


console.log(URL);

export async function userIsExistAttendance(dni = '', urlImage, callback = () => { }) {
    if (dni === '') return null;
    try {
        const response = await axios.post(`${URL}/user/attendance/machine/${dni}`, { imageReference: urlImage })
        callback(null, response);
    }
    catch (error) {
        console.log(error);
        callback(error?.response);
    }
}


export async function save(dni, body) {
    if (!dni) return null;
    try {
        const response = await axios.post(`${URL}/user/attendanc/${dni}`,);
        console.log(response);
    }
    catch (error) {
        console.log(error)
    }
}


//24 939 156