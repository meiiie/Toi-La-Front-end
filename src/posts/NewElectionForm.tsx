import { FieldError, Merge, useForm } from 'react-hook-form';
import { ValidationError } from './ValidationError';
import { NewElectionData } from './types';
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

type Props = {
  onSave: (newElection: NewElectionData) => void;
};

export function NewElectionForm({ onSave }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<NewElectionData>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
  });

  const [candidates, setCandidates] = useState<string[]>([]);
  const [voters, setVoters] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string>('');

  const fieldStyle = 'flex flex-col mb-4';
  const labelStyle = 'mb-2 font-semibold text-gray-700';
  const inputStyle =
    'form-input w-full p-4 border rounded-lg shadow-sm focus:border-primary focus:ring focus:ring-primary-light focus:ring-opacity-50';
  const textareaStyle =
    'form-textarea w-full p-4 border rounded-lg shadow-sm focus:border-primary focus:ring focus:ring-primary-light focus:ring-opacity-50';
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

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    setData: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
        const values = json.flat();
        setData(values);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        setValue('imageUrl', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setImageUrl(e.target?.result as string);
            setValue('imageUrl', e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  return (
    <form
      noValidate
      className="border-b py-4 mx-auto max-w-lg bg-gradient-to-r from-pink-100 to-blue-200 rounded-lg shadow-lg p-6"
      onSubmit={handleSubmit(onSave)}
    >
      <div className="card p-4 shadow-md rounded-lg mb-4 bg-white">
        <h2 className="text-xl font-bold mb-2 text-primary">Thông tin cuộc bầu cử</h2>
        <div className={fieldStyle}>
          <label htmlFor="name" className={labelStyle}>
            Election Name
          </label>
          <input
            type="text"
            id="name"
            {...register('name', { required: 'You must enter the election name' })}
            className={`${inputStyle} ${getEditorStyle(errors.name)}`}
          />
          <ValidationError fieldError={errors.name} className={errorStyle} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="organizer" className={labelStyle}>
            Organizer
          </label>
          <input
            type="text"
            id="organizer"
            {...register('organizer', { required: 'You must enter the organizer' })}
            className={`${inputStyle} ${getEditorStyle(errors.organizer)}`}
          />
          <ValidationError fieldError={errors.organizer} className={errorStyle} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="description" className={labelStyle}>
            Description
          </label>
          <textarea
            id="description"
            {...register('description', { required: 'You must enter the description' })}
            className={`${textareaStyle} ${getEditorStyle(errors.description)}`}
          />
          <ValidationError fieldError={errors.description} className={errorStyle} />
        </div>
      </div>

      <div className="card p-4 shadow-md rounded-lg mb-4 bg-white">
        <h2 className="text-xl font-bold mb-2 text-primary">Thời gian</h2>
        <div className={fieldStyle}>
          <label htmlFor="startDate" className={labelStyle}>
            Start Date and Time
          </label>
          <input
            type="datetime-local"
            id="startDate"
            {...register('startDate', { required: 'You must enter the start date and time' })}
            className={`${inputStyle} ${getEditorStyle(errors.startDate)}`}
          />
          <ValidationError fieldError={errors.startDate} className={errorStyle} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="endDate" className={labelStyle}>
            End Date and Time
          </label>
          <input
            type="datetime-local"
            id="endDate"
            {...register('endDate', { required: 'You must enter the end date and time' })}
            className={`${inputStyle} ${getEditorStyle(errors.endDate)}`}
          />
          <ValidationError fieldError={errors.endDate} className={errorStyle} />
        </div>
      </div>

      <div className="card p-4 shadow-md rounded-lg mb-4 bg-white">
        <h2 className="text-xl font-bold mb-2 text-primary">Trạng thái và hình ảnh</h2>
        <div className={fieldStyle}>
          <label htmlFor="status" className={labelStyle}>
            Status
          </label>
          <select
            id="status"
            {...register('status', { required: 'You must select a status' })}
            className={`${inputStyle} ${getEditorStyle(errors.status)}`}
          >
            <option value="" hidden></option>
            <option value="ongoing">Ongoing</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
          </select>
          <ValidationError fieldError={errors.status} className={errorStyle} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="imageUrl" className={labelStyle}>
            Image URL
          </label>
          <input
            type="text"
            id="imageUrl"
            {...register('imageUrl')}
            className={inputStyle}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onPaste={handlePaste}
          />
          <input type="file" accept="image/*" onChange={handleImageUpload} className="mt-2" />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Election"
              className="mt-4 w-full h-48 object-cover rounded-lg"
            />
          )}
        </div>
      </div>

      <div className="card p-4 shadow-md rounded-lg mb-4 bg-white">
        <h2 className="text-xl font-bold mb-2 text-primary">Cử tri và ứng viên</h2>
        <div className={fieldStyle}>
          <label htmlFor="voters" className={labelStyle}>
            Voters (comma separated)
          </label>
          <textarea
            id="voters"
            value={voters.join('\n')}
            onChange={(e) => setVoters(e.target.value.split('\n'))}
            className={`${textareaStyle} ${getEditorStyle(errors.voters)}`}
          />
          <input
            type="file"
            accept=".csv, .xlsx"
            onChange={(e) => handleFileUpload(e, setVoters)}
            className="mt-2"
          />
          <ValidationError fieldError={errors.voters} className={errorStyle} />
        </div>

        <div className={fieldStyle}>
          <label htmlFor="candidates" className={labelStyle}>
            Candidates (comma separated)
          </label>
          <textarea
            id="candidates"
            value={candidates.join('\n')}
            onChange={(e) => setCandidates(e.target.value.split('\n'))}
            className={`${textareaStyle} ${getEditorStyle(errors.candidates)}`}
          />
          <input
            type="file"
            accept=".csv, .xlsx"
            onChange={(e) => handleFileUpload(e, setCandidates)}
            className="mt-2"
          />
          <ValidationError fieldError={errors.candidates} className={errorStyle} />
        </div>
      </div>

      <div className={fieldStyle}>
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 h-10 px-6 font-semibold bg-primary text-white rounded-lg shadow-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
        >
          Save
        </button>

        {isSubmitSuccessful && (
          <div role="alert" className="text-green-500 text-xs mt-1">
            The election was successfully saved
          </div>
        )}
      </div>
    </form>
  );
}
