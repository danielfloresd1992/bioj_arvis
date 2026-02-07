import { Button } from "@mui/material"


export default function NumericKeypad({ callbackEvent = null }){


    const arrValue = [7,8,9,4,5,6,1,2,3,'⌫', 0,'⏎'];

    function chunkArray(arr, size) { const result = []; for (let i = 0; i < arr.length; i += size) { result.push(arr.slice(i, i + size)); } return result; }

    const chuns = chunkArray(arrValue, 3);

    return(
        <div
            style={{
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
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexDirection: 'row',
                                gap: '.5rem'
                            }}
                        >
                            {
                                line.map((value, index) => (
                                    <button
                                        style={{
                                            width: '100%'
                                        }}
                                        onClick={() => callbackEvent(value)}
                                    >
                                        {value}</button>
                                ))
                            }
                        </div>
                    )
                })
            }
        </div>
    );
}
