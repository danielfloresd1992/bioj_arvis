import { useState, forwardRef, useImperativeHandle } from 'react';


// Configuración visual por tipo de mensaje
const DIALOG_STYLES = {
    error: {
        headerBg: '#f44336',
        headerColor: '#fff',
        icon: '/icons8-error-50.png'
    },
    warning: {
        headerBg: '#ff9800',
        headerColor: '#fff',
        icon: '/icons8-búsqueda-50.png'
    },
    success: {
        headerBg: '#4caf50',
        headerColor: '#fff',
        icon: '/icons8-recibo-aprobado-50.png'
    }
};


 export default forwardRef(function CustomDialog({title='Soy una ventana', typeMessage='error', callback=() => {}}, ref){


    const [openedState, setOpenedState] = useState({ open:false, title:'', description:null, typeMessage:'error'});



    const closeDialog = () => {
        setOpenedState({open:false, title:'', description:null, typeMessage:'error'});
        callback();
    };


    const openDialog = (title='', type='error', description=() => null) => {
        setOpenedState({
            open: true,
            title,
            typeMessage: type,
            description: description,
        });
    };


    useImperativeHandle(ref, ()=> ({
        closeDialog,
        openDialog
    }));



    if(!openedState.open) return null;


    const style = DIALOG_STYLES[openedState.typeMessage] || DIALOG_STYLES.error;
    

    return(
        <div
            style={{
                width: '100%',
                height: '100%', 
                position: 'absolute',
                top: '0',
                left: '0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.35)',
                zIndex: 1000
            }}
            onClick={closeDialog}
        >
            <div
                style={{
                    width: '50%',
                    height: '40%',
                    backgroundColor: '#fff',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >       
                <div style={{
                    width: '100%',
                    height: '55px',
                    backgroundColor: style.headerBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 1em',
                    flexShrink: 0
                }}>

                    <h3 style={{
                        fontSize: '1.4rem',
                        fontWeight: 'bold',
                        color: style.headerColor,
                        margin: 0
                    }}>
                        {openedState.title}
                    </h3>
                  
                    <img style={{
                        width: '35px',
                        filter: 'brightness(0) invert(1)'
                    }} src={style.icon} alt='dialog-header-ico' />
        
                </div>
         
                <div
                    style={{
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '1rem'
                    }}
                >
                    {openedState.description}
                </div>
            </div>
        </div>
    );
});