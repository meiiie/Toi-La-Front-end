import { FieldError, Merge, useForm } from 'react-hook-form';
import { ValidationError } from '../pages/ValidationError';
import { NewAccountData } from '../store/types';
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { checkUsernameExists } from '../api/register';

type Props = {
  onSave: (newAccount: NewAccountData) => void;
};

export function NewAccountForm({ onSave }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<NewAccountData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const [usernameChecking, setUsernameChecking] = useState(false);

  const fieldStyle = 'flex flex-col mb-4';
  const labelStyle = 'mb-2 font-semibold text-gray-700';
  const inputStyle =
    'form-input w-full p-4 border rounded-lg shadow-sm focus:border-primary focus:ring focus:ring-primary-light focus:ring-opacity-50';
  const errorStyle = 'text-red-500 text-xs mt-1';

  function getEditorStyle(
    fieldError:
      | FieldError
      | (FieldError | undefined)[]
      | Merge<FieldError, (FieldError | undefined)[]>
      | undefined,
  ) {
    if (Array.isArray(fieldError)) {
      return fieldError.some((error) => error) ? 'border-red-500' : '';
    }
    return fieldError ? 'border-red-500' : '';
  }

  const handleUsernameBlur = async (event: React.FocusEvent<HTMLInputElement>) => {
    const username = event.target.value;
    if (username) {
      setUsernameChecking(true);
      try {
        const exists = await checkUsernameExists(username);
        if (exists) {
          setError('username', {
            type: 'manual',
            message: 'Tên đăng nhập đã tồn tại. Vui lòng chọn tên đăng nhập khác.',
          });
        } else {
          clearErrors('username');
        }
      } catch (error) {
        setError('username', {
          type: 'manual',
          message: 'Không thể kiểm tra tên đăng nhập. Vui lòng thử lại.',
        });
      } finally {
        setUsernameChecking(false);
      }
    }
  };

  return (
    <form
      noValidate
      className="border-b py-4 mx-auto max-w-lg bg-gradient-to-r from-pink-100 to-blue-200 rounded-lg shadow-lg p-6"
      onSubmit={handleSubmit(onSave)}
    >
      <h1 className="text-3xl font-bold text-blue-700 text-center mb-4">Tạo tài khoản mới</h1>
      <p className="text-center mb-6">Nhanh chóng và dễ dàng.</p>
      <div className="card p-4 shadow-md rounded-lg mb-4 bg-white">
        <h2 className="text-xl font-bold mb-2 text-primary">Thông tin tài khoản</h2>
        <div className={fieldStyle}>
          <label htmlFor="firstName" className={labelStyle}>
            Họ
          </label>
          <input
            type="text"
            id="firstName"
            {...register('firstName', { required: 'Bạn phải nhập họ' })}
            className={`${inputStyle} ${getEditorStyle(errors.firstName)}`}
          />
          <ValidationError fieldError={errors.firstName} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="lastName" className={labelStyle}>
            Tên
          </label>
          <input
            type="text"
            id="lastName"
            {...register('lastName', { required: 'Bạn phải nhập tên' })}
            className={`${inputStyle} ${getEditorStyle(errors.lastName)}`}
          />
          <ValidationError fieldError={errors.lastName} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="email" className={labelStyle}>
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register('email', { required: 'Bạn phải nhập email' })}
            className={`${inputStyle} ${getEditorStyle(errors.email)}`}
          />
          <ValidationError fieldError={errors.email} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="phone" className={labelStyle}>
            Số điện thoại
          </label>
          <input
            type="text"
            id="phone"
            {...register('phone', { required: 'Bạn phải nhập số điện thoại' })}
            className={`${inputStyle} ${getEditorStyle(errors.phone)}`}
          />
          <ValidationError fieldError={errors.phone} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="username" className={labelStyle}>
            Tên đăng nhập
          </label>
          <input
            type="text"
            id="username"
            {...register('username', { required: 'Bạn phải nhập tên đăng nhập' })}
            className={`${inputStyle} ${getEditorStyle(errors.username)}`}
            onBlur={handleUsernameBlur}
          />
          {usernameChecking && <p className="text-blue-500 text-xs mt-1">Đang kiểm tra...</p>}
          <ValidationError fieldError={errors.username} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="password" className={labelStyle}>
            Mật khẩu
          </label>
          <input
            type="password"
            id="password"
            {...register('password', { required: 'Bạn phải nhập mật khẩu' })}
            className={`${inputStyle} ${getEditorStyle(errors.password)}`}
          />
          <ValidationError fieldError={errors.password} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="confirmPassword" className={labelStyle}>
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            id="confirmPassword"
            {...register('confirmPassword', {
              required: 'Bạn phải xác nhận mật khẩu',
              validate: (value) =>
                value === watch('password') || 'Mật khẩu và xác nhận mật khẩu không khớp',
            })}
            className={`${inputStyle} ${getEditorStyle(errors.confirmPassword)}`}
          />
          <ValidationError fieldError={errors.confirmPassword} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="birthdate" className={labelStyle}>
            Ngày sinh
          </label>
          <input
            type="date"
            id="birthdate"
            {...register('birthdate', { required: 'Bạn phải nhập ngày sinh' })}
            className={`${inputStyle} ${getEditorStyle(errors.birthdate)}`}
          />
          <ValidationError fieldError={errors.birthdate} />
        </div>

        <div className={fieldStyle}>
          <label className={labelStyle}>Giới tính</label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="Nữ"
                {...register('gender', { required: 'Bạn phải chọn giới tính' })}
                className="form-radio"
              />
              <span>Nữ</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="Nam"
                {...register('gender', { required: 'Bạn phải chọn giới tính' })}
                className="form-radio"
              />
              <span>Nam</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="Tùy chỉnh"
                {...register('gender', { required: 'Bạn phải chọn giới tính' })}
                className="form-radio"
              />
              <span>Tùy chỉnh</span>
            </label>
          </div>
          <ValidationError fieldError={errors.gender} />
        </div>
      </div>

      <div className={fieldStyle}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 h-10 px-6 font-semibold bg-primary text-white rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        >
          Đăng ký
        </button>

        {isSubmitSuccessful && (
          <div role="alert" className="text-green-500 text-xs mt-1">
            Tài khoản đã được tạo thành công
          </div>
        )}
      </div>
      <p className="text-center mt-4">
        Bạn đã có tài khoản ư?{' '}
        <NavLink to="/login" className="text-blue-500 hover:underline">
          Đăng nhập
        </NavLink>
      </p>
    </form>
  );
}
