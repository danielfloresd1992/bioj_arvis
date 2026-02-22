import { isDesktop } from 'react-device-detect';



export function CustomInputNumeric({ labelText = '', value= '' , placeholder='', changeEvent=()=>{}}){


    return(
        <div 
            style={{
                width:'100%',
                height: '70px',
                display:'flex',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: '5px',
                overflow: 'hidden'
            }}
        >
            <p
                style={{
                    color: '#424242',
                    fontSize: '1.1rem',
                    fontWeight: "bolder",
                    padding: '0 0.2rem'
                }}
            >{labelText}</p>
            
            <div 
                style={{
                    width: 'calc(100% - 40px)',
                    height: '100%'
                }}
            >
                <input style={{
                        backgroundColor: '#ffffff00',
                        color: '#000',
                        border: 'none',
                        width: '100%',
                        height: '100%',
                        padding: '.5rem',
                        fontSize: '1.4rem'
                    }} 
                    onFocus={e => e.target.blur()}
                    placeholder={placeholder}
                    value={value} type='text'
                    onKeyDown={(e) => {
                        if(isDesktop){
                            changeEvent(e.key);
                        }
                    }}
                 
                />
                
            </div>
            <div style={{
                height: '100%',
                width: '70px',
                backgroundColor: '#2c2c2c',
                display: 'flex',
                justifyContent: 'center', 
                alignItems: 'center'
            }}>
                <img style={{ width: '20px' }} src='/icons8-búsqueda-50.png' alt='seach-ico' />
            </div>
        </div>
    );
}