

const audioBtn = new Audio('/touch.ogg');
const sudioSucessful = new Audio('/successful.ogg')



export const clickSount = async () => {
    const result = await audioBtn.play();
    return result;
};



export const sucessAudio = async () => {
    const result = await sudioSucessful.play();
    return result;
};

