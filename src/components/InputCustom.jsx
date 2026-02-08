




export function CustomInputNumeric({ value }){


    return(
        <div 
            style={{
                width:'100%',
                height: '45px',
                display:'flex',
                backgroundColor: '#fff',
                borderRadius: '5px',
                overflow: 'hidden'
            }}
        >
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
                    fontSize: '1.2rem'
                }} 
                value={value} type='text'/>
            </div>
            <div style={{
                width: '40px',
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