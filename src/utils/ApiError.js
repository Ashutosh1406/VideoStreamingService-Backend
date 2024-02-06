
class ApiError extends Error {
    constructor(
        statusCode,
        message="Something went wrong",
        errors = [],
        statck = "" //stact trace
    ){
        super(message)
        this.statusCode=statusCode
        this.data = null
        this.message = message
        this.success = false
        this.errors = errors

        // for production could be avoided to get error and get the exact stack tree

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError}