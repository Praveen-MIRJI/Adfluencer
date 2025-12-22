import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Megaphone, FileText, DollarSign, Target, CheckCircle,
  Instagram, Youtube, Twitter, Facebook, Linkedin, Play,
  Image, Video, MessageSquare, FileEdit, Clock, Calendar,
  Users, Lightbulb, ArrowLeft, ArrowRight, Sparkles
} from 'lucide-react';
import api from '../../lib/api';
import { Category } from '../../types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { Card, CardContent } from '../../components/ui/Card';

interface AdForm {
  title: string;
  description: string;
  categoryId: string;
  platform: string;
  contentType: string;
  duration: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  requirements: string;
  targetAudience: string;
}

const platforms = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'from-purple-500 to-pink-500' },
  { value: 'YOUTUBE', label: 'YouTube', icon: Youtube, color: 'from-red-500 to-red-600' },
  { value: 'TWITTER', label: 'Twitter', icon: Twitter, color: 'from-blue-400 to-blue-500' },
  { value: 'TIKTOK', label: 'TikTok', icon: Play, color: 'from-gray-800 to-gray-900' },
  { value: 'FACEBOOK', label: 'Facebook', icon: Facebook, color: 'from-blue-600 to-blue-700' },
  { value: 'LINKEDIN', label: 'LinkedIn', icon: Linkedin, color: 'from-blue-700 to-blue-800' },
];

const contentTypes = [
  { value: 'STORY', label: 'Story', icon: Clock, desc: '24-hour content' },
  { value: 'POST', label: 'Post', icon: Image, desc: 'Feed post' },
  { value: 'REEL', label: 'Reel', icon: Play, desc: 'Short video' },
  { value: 'VIDEO', label: 'Video', icon: Video, desc: 'Long-form video' },
  { value: 'TWEET', label: 'Tweet', icon: MessageSquare, desc: 'Text post' },
  { value: 'ARTICLE', label: 'Article', icon: FileEdit, desc: 'Written content' },
];

const steps = [
  { id: 1, title: 'Basic Info', icon: FileText },
  { id: 2, title: 'Platform', icon: Megaphone },
  { id: 3, title: 'Budget', icon: DollarSign },
  { id: 4, title: 'Details', icon: Target },
];

export default function PostAdvertisement() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm<AdForm>();
  const watchedPlatform = watch('platform');
  const watchedContentType = watch('contentType');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const onSubmit = async (data: AdForm) => {
    if (Number(data.budgetMin) > Number(data.budgetMax)) {
      toast.error('Minimum budget cannot exceed maximum budget');
      return;
    }

    setLoading(true);
    try {
      await api.post('/advertisements', data);
      toast.success('Campaign created successfully!');
      navigate('/client/my-ads');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof AdForm)[] = [];
    
    if (currentStep === 1) fieldsToValidate = ['title', 'description', 'categoryId'];
    if (currentStep === 2) fieldsToValidate = ['platform', 'contentType'];
    if (currentStep === 3) fieldsToValidate = ['budgetMin', 'budgetMax', 'deadline'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
        <p className="text-gray-600 mt-1">Fill in the details to find the perfect influencer for your brand</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentStep >= step.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs mt-2 font-medium ${
                  currentStep >= step.id ? 'text-primary-600' : 'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 mt-[-20px] ${
                  currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-sm text-gray-500">Tell us about your campaign</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Input
                    label="Campaign Title"
                    placeholder="e.g., Summer Collection Launch - Fashion Influencer Needed"
                    {...register('title', {
                      required: 'Title is required',
                      minLength: { value: 5, message: 'Title must be at least 5 characters' }
                    })}
                    error={errors.title?.message}
                  />
                  <p className="text-xs text-gray-500 mt-1">Make it catchy and descriptive to attract the right influencers</p>
                </div>

                <div>
                  <Textarea
                    label="Campaign Description"
                    rows={5}
                    placeholder="Describe your campaign goals, what you're promoting, key messages you want to convey, and any specific requirements..."
                    {...register('description', {
                      required: 'Description is required',
                      minLength: { value: 20, message: 'Description must be at least 20 characters' }
                    })}
                    error={errors.description?.message}
                  />
                  <p className="text-xs text-gray-500 mt-1">Be detailed - this helps influencers understand if they're a good fit</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map((cat) => (
                      <label
                        key={cat.id}
                        className={`relative flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          watch('categoryId') === cat.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          value={cat.id}
                          {...register('categoryId', { required: 'Category is required' })}
                          className="sr-only"
                        />
                        <span className={`text-sm font-medium ${
                          watch('categoryId') === cat.id ? 'text-primary-700' : 'text-gray-700'
                        }`}>
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.categoryId && (
                    <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Platform & Content */}
        {currentStep === 2 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Platform & Content Type</h2>
                  <p className="text-sm text-gray-500">Where do you want your campaign to run?</p>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Platform</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {platforms.map((p) => (
                      <label
                        key={p.value}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          watchedPlatform === p.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          value={p.value}
                          {...register('platform', { required: 'Platform is required' })}
                          className="sr-only"
                        />
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-2`}>
                          <p.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className={`text-sm font-medium ${
                          watchedPlatform === p.value ? 'text-primary-700' : 'text-gray-700'
                        }`}>
                          {p.label}
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.platform && (
                    <p className="text-sm text-red-600 mt-2">{errors.platform.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Content Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {contentTypes.map((ct) => (
                      <label
                        key={ct.value}
                        className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          watchedContentType === ct.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          value={ct.value}
                          {...register('contentType', { required: 'Content type is required' })}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            watchedContentType === ct.value ? 'bg-primary-100' : 'bg-gray-100'
                          }`}>
                            <ct.icon className={`w-5 h-5 ${
                              watchedContentType === ct.value ? 'text-primary-600' : 'text-gray-500'
                            }`} />
                          </div>
                          <div>
                            <span className={`text-sm font-medium block ${
                              watchedContentType === ct.value ? 'text-primary-700' : 'text-gray-700'
                            }`}>
                              {ct.label}
                            </span>
                            <span className="text-xs text-gray-500">{ct.desc}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.contentType && (
                    <p className="text-sm text-red-600 mt-2">{errors.contentType.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Budget & Timeline */}
        {currentStep === 3 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Budget & Timeline</h2>
                  <p className="text-sm text-gray-500">Set your budget range and deadline</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Budget Range */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-4">Budget Range (USD)</label>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="100"
                          {...register('budgetMin', {
                            required: 'Minimum budget is required',
                            min: { value: 1, message: 'Budget must be at least $1' }
                          })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      {errors.budgetMin && (
                        <p className="text-sm text-red-600 mt-1">{errors.budgetMin.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          min="1"
                          placeholder="1000"
                          {...register('budgetMax', {
                            required: 'Maximum budget is required',
                            min: { value: 1, message: 'Budget must be at least $1' }
                          })}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      {errors.budgetMax && (
                        <p className="text-sm text-red-600 mt-1">{errors.budgetMax.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 mt-4 p-3 bg-blue-50 rounded-lg">
                    <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      Tip: A wider budget range attracts more diverse influencers. The average campaign budget is $200-$500.
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Bid Deadline
                    </label>
                    <input
                      type="date"
                      min={minDate}
                      {...register('deadline', { required: 'Deadline is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.deadline && (
                      <p className="text-sm text-red-600 mt-1">{errors.deadline.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Last date for influencers to submit bids</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-1" />
                      Content Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 24 hours, 3 days, 1 week"
                      {...register('duration', { required: 'Duration is required' })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.duration && (
                      <p className="text-sm text-red-600 mt-1">{errors.duration.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">How long should the content stay live?</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Additional Details */}
        {currentStep === 4 && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Additional Details</h2>
                  <p className="text-sm text-gray-500">Help influencers understand your needs better</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Target Audience
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Tech enthusiasts aged 18-35, fitness lovers, young professionals"
                    {...register('targetAudience')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Describe your ideal audience demographics and interests</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Specific Requirements
                  </label>
                  <Textarea
                    rows={4}
                    placeholder="Any specific requirements, dos and don'ts, hashtags to use, mentions required, content guidelines..."
                    {...register('requirements')}
                  />
                  <p className="text-xs text-gray-500 mt-1">Include any brand guidelines, required hashtags, or content restrictions</p>
                </div>

                {/* Summary Preview */}
                <div className="bg-gray-50 rounded-xl p-6 mt-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    Campaign Summary
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Platform:</span>
                      <span className="ml-2 font-medium text-gray-900">{watchedPlatform || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Content:</span>
                      <span className="ml-2 font-medium text-gray-900">{watchedContentType || '-'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Budget:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        ${watch('budgetMin') || '0'} - ${watch('budgetMax') || '0'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Deadline:</span>
                      <span className="ml-2 font-medium text-gray-900">{watch('deadline') || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={currentStep === 1 ? 'invisible' : ''}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button type="button" onClick={nextStep}>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button type="submit" loading={loading}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
