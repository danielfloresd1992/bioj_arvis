import { useState, forwardRef, useImperativeHandle } from 'react';



 export default forwardRef(function CustomDialog({title='Soy una ventana', typeMessage='error', callback=() => {}}, ref){


    const [openedState, setOpenedState] = useState({ open:false, title:'', description:null, typeMessage:''});



    const closeDialog = () => {
        setOpenedState({open:false, title:'', description:null, typeMessage:''});
        callback();
    };


    const openDialog = (title='', type='error', description=() => null, ) => {
        setOpenedState({
            open: true,
            title,
            description:description,

        });
    };


    useImperativeHandle(ref, ()=> ({
        closeDialog,
        openDialog
    }));



    if(!openedState.open) return null;
    

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
                alignItems: 'center'
            }}
            onClick={closeDialog}
        >
            <div
                style={{
                    width: '50%',
                    height: '40%',
                    backgroundColor: '#fff',
                    boxShadow: '2px 2px 10px #3f3f3f'
                }}
            >       
                <div style={{
                    width: '100%',
                    height: '50px',
                    backgroundColor: '#d1d1d1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '.5em'
                }}>

                    <h3 className="text-4xl font-bold text-blue-200">
                        {openedState.title}
                    </h3>
                  
                        <img style={{
                            width: '35px'
                        }} src={openedState.typeMessage === 'error' ? '/icons8-error-50.png' : '/icons8-recibo-aprobado-50.png'} alt='isp-header-error' />
        
                </div>
         
                <div
                    style={{
                        width: '100%',
                        height: '100%',       
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}
                >
                    {openedState.description}
                </div>
            </div>
        </div>
    );
});