const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'
class Promise {
   constructor(excetor) {
      // 初始状态
      this.status = PENDING
      // 将成功、失败结果放在this 上， 便于 then catch 访问
      this.value = undefined
      this.reason = undefined
      // 成功回调队列
      this.onFulfilledCallbacks = []
      // 失败回调队列
      this.onRejectCallbacks = []
      const resolve = value => {
         // 只有进行中状态才能更改状态
         if (this.status === PENDING) {
            this.status = FULFILLED
            this.value = value
            // 成功函数一次执行
            this.onFulfilledCallbacks.forEach(fn => fn(this.value))
         }
      }

      const reject = reason => {
         //  进行中才能更改状态
         if (this.status === PENDING) {
            this.status = REJECTED
            this.reason = reason
            this.onRejectCallbacks.forEach(fn => fn(this.reason))
         }
      }
      try {
         excetor(resolve, reject)
      } catch (error) {
         reject(error)
      }
   }

   // 非 constructor
   then(onFulfilled, onRejected) {
      onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
      onRejected = typeof onRejected === 'function' ? onRejected : reason => {
         throw new Error(reason instanceof Error ? reason.message : reason)
      }
      // 保存this
      const self = this
      return new Promise((resolve, reject) => {
         if (self.status === PENDING) {
            self.onFulfilledCallbacks.push(() => {
               try {
                  setTimeout(() => {
                     const result = onFulfilled(self.value)
                     // 分两种清空
                     // 1: 回调函数返回是Promise 执行then 操作
                     // 2: 如果不是Promise 直接用resolve函数
                     result instanceof Promise ? Promise.then(resolve, reject) : resolve(result)
                  })
               } catch (e) {
                  reject(e)
               }
            })
            self.onRejectCallbacks.push(() => {
               try {
                  setTimeout(() => {
                     const result = onRejected(self.reason)
                     result instanceof Promise ? result.then(resolve, reject) : resolve(result)
                  })
               } catch (e) {
                  reject(e)
               }
            })
         } else if (self.status === FULFILLED) {
            try {
               setTimeout(() => {
                  const result = onFulfilled(self.value)
                  result instanceof Promise ? result.then(resolve, reject) : resolve(result)
               })
            } catch (e) {
               reject(e)
            }
         } else if (self.status === REJECTED) {
            try {
               setTimeout(() => {
                  const result = onRejected(self.reason)
                  result instanceof Promise ? result.then(resolve, reject) : resolve(result)
               })
            } catch (e) {
               reject(e)
            }
         }
      })
   }

   catch (onRejected) {
      return this.then(null, onRejected)
   }

   // promise 实例 
   static resolve(value) {
      if (value instanceof Promise) {
         return value
      } else {
         return new Promise((resolve, reject) => resolve(value))
      }
   }
   // promise.reject 会返回一个promise实例，状态为REJECTED
   // 与Promise.resolve不同的是,Promise.rejected方法的参数会原封不动地作为reject的参数
   static reject(reason) {
      return new Promise((resolve, reject) => reject(reason))
   }
   // all 所有promise状态为FUIFILLED,返回的promise状态 才变为FUIFILLED
   // 一个 promise状态为Rejected, 返回的promise状态就变为Rejected
   //  数组成员不一定都是promise， 需要使用 promise。resolve 处理
   static all(PromiseArr) {
      let len = Promise.length
      const values = new Array(len)
      const count = 0
      return new Promise((resolve, reject) => {
         for (let i = 0; i < len; i++) {
            Promise.resolve(PromiseArr[i]).then(val => {
               values[i] = val;
               count++
               if (count === len) resolve(values)
            }, err=> reject(err))
         }
      })
   }
   // race
   static race(PromiseArr) {
      return new Promise((resolve, reject)=> {
         PromiseArr.forEach(p=> {
            PromiseArr.resolve(p).then(val => resolve(val), err => reject(err))
         })
      })
   }




}