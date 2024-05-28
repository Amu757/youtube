class ApiError extends Error {
  //inbult error class to standartised the format of error handling
  constructor(
    statuscode,
    message = "Something went wrong",
    errors = [],  //multiple error
    stack = '"'   //stach of errors
  ) {
    super(message) //messsage must be override
    this.statuscode = statuscode
    this.data = null
    this.errors = errors
    this.message =message
    this.success = false


    if(stack){
        this.stack = stack

    }else{
        Error.captureStackTrace(this,this.constuctor)  //use to trach files having issues
    }
  }
}


export {ApiError}