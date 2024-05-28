class ApiResponse{
    constructor(statuscode,data,message="successful"){
this.statuscode = statuscode
this.data = data
this.message = message
this.success = statuscode < 400 
    }
}

export {ApiResponse}