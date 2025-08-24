import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { Eye, EyeOff } from 'lucide-react'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (result.success) {
        toast.success('Welcome back!')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300 animate-bounce-gentle">
            <span className="text-white font-bold text-3xl">LW</span>
          </div>
          <h2 className="text-4xl font-bold gradient-text">Sign in to LiwaywAI</h2>
          <p className="mt-3 text-gray-600 text-lg">Access your digital lending account</p>
        </div>

        <form className="mt-8 space-y-6 animate-slide-up" onSubmit={handleSubmit(onSubmit)}>
          <div className="card-flat p-6 space-y-4">

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="input"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Signing in...
              </div>
            ) : (
              'Sign in'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 glass-card p-6 animate-slide-up stagger-2">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Demo Credentials</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                <span><strong>Borrower:</strong> demo@borrower.com</span>
                <span className="text-xs text-gray-500">password123</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white/50 rounded-lg">
                <span><strong>Admin:</strong> admin@liwaywai.com</span>
                <span className="text-xs text-gray-500">admin123</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login