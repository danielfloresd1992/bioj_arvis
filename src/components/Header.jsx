


export default function CustonHeader(){

    return(
        <div 
            style={{
                backgroundColor: '#4fd34b',
                padding: '0 2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100px'
            }}
        >
            <div><img src='/image.webp' alt='image-logo' /></div>
            <div style={{border: '1px solid #ddd', padding: '.2rem 1rem'}}>
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        margin: '.1rem'
                    }}
                >
                    <img style={{ 
                        width: '50px'
                    }} src='/logojarvis.webp' alt='logo-jarvis' />
                    <p
                        style={{
                            fontSize: '2rem',
                            color: '#fff',
                            fontWeight: 'medium'
                        }}
                    >BioJarvis</p>
                </div>
                <p 
                    style={{
                         color: '#ffffff',
                    }}
                >Control de entrada y salida</p>
            </div>
        </div> 
    );
}