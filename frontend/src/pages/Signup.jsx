import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/LoadingSpinner'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [consents, setConsents] = useState({
    dataProcessing: false,
    creditCheck: false,
    marketing: false
  })
  const { signup } = useAuth()

  const { register, handleSubmit, formState: { errors }, watch } = useForm()
  const password = watch('password')

  const handleConsentChange = (key) => {
    setConsents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const onSubmit = async (data) => {
    // Check required consents
    if (!consents.dataProcessing || !consents.creditCheck) {
      toast.error('Please accept required consents to continue')
      return
    }

    setIsLoading(true)
    try {
      const result = await signup({
        email: data.email,
        password: data.password,
        name: data.name,
        city: data.city,
        occupation: data.occupation
      })

      if (result.success) {
        toast.success('Account created successfully!')
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  const allRequiredConsents = consents.dataProcessing && consents.creditCheck

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-fade-in">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <span className="text-white font-bold text-3xl">LW</span>
          </div>
          <h2 className="text-4xl font-bold gradient-text">Join LiwaywAI</h2>
          <p className="mt-3 text-gray-600 text-lg">Create your digital lending account</p>
        </div>

        <form className="mt-8 space-y-6 animate-slide-up" onSubmit={handleSubmit(onSubmit)}>
          {/* Personal Information */}
          <div className="card-flat p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
                type="text"
                className="input"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-danger-600">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  {...register('city', { required: 'City is required' })}
                  type="text"
                  className="input"
                  placeholder="Your city"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-danger-600">{errors.city.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Occupation
                </label>
                <input
                  {...register('occupation', { required: 'Occupation is required' })}
                  type="text"
                  className="input"
                  placeholder="Your job"
                />
                {errors.occupation && (
                  <p className="mt-1 text-sm text-danger-600">{errors.occupation.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Create a password"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type="password"
                className="input"
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {/* Consent Section */}
          <div className="card-flat p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Consent & Permissions</h3>

            <div className="space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.dataProcessing}
                  onChange={() => handleConsentChange('dataProcessing')}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Data Processing <span className="text-danger-600">*</span>
                  </span>
                  <p className="text-xs text-gray-600">
                    I consent to the processing of my personal data for loan assessment and account management.
                  </p>
                </div>
                {consents.dataProcessing && (
                  <CheckCircle className="text-success-500 mt-1" size={16} />
                )}
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.creditCheck}
                  onChange={() => handleConsentChange('creditCheck')}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">
                    Credit Assessment <span className="text-danger-600">*</span>
                  </span>
                  <p className="text-xs text-gray-600">
                    I authorize credit checks and risk assessment for loan applications.
                  </p>
                </div>
                {consents.creditCheck && (
                  <CheckCircle className="text-success-500 mt-1" size={16} />
                )}
              </label>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consents.marketing}
                  onChange={() => handleConsentChange('marketing')}
                  className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Marketing Communications</span>
                  <p className="text-xs text-gray-600">
                    I agree to receive promotional offers and product updates (optional).
                  </p>
                </div>
                {consents.marketing && (
                  <CheckCircle className="text-success-500 mt-1" size={16} />
                )}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !allRequiredConsents}
            className="btn-primary w-full disabled:opacity-50 disabled:transform-none"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Signup