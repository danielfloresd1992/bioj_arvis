import { Button } from "@mui/material"


export default function NumericKeypad({ callbackEvent = null }){


    const arrValue = [7,8,9,4,5,6,1,2,3,'⌫', 0,'⏎'];

    function chunkArray(arr, size) { const result = []; for (let i = 0; i < arr.length; i += size) { result.push(arr.slice(i, i + size)); } return result; }

    const chuns = chunkArray(arrValue, 3);

    return(
        <div
            style={{
                height: 'calc(100%)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '.5rem'
            }}
        >
            {
                chuns.map((line, i) => { 
                    return (
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexDirection: 'row',
                                gap: '.5rem'
                            }}
                        >
                            {
                                line.map((value, index) => (
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '5px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            backgroundColor: '#333333',
                                            color: '#fff', textAlign: 'center',  fontSize: '2rem'
                                        }}
                                        onClick={(e) => { 
                                                if(typeof callbackEvent === 'function') callbackEvent(e.target.textContent)
                                            }
                                        }
                                    >   
                                        {value}
                                    </div>
                                ))
                            }
                        </div>
                    )
                })
            }
        </div>
    );
}
