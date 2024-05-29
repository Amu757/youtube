// this handler is use to handle request and error no need to use try catch on every req

const asyncHandler = (requestHandler) =>  //passing requestHandler to asyncHandler function then inside requestHandler an async function defination is given
    {
        (req,res,next) =>{
            Promise.resolve(requestHandler(req,res,next)).catch((err)=>{  //invoking a async function manualy
                next(err)
            })
        }
    }

    export {asyncHandler}